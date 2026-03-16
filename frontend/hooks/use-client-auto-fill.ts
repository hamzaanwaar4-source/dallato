import { useState, useRef, useEffect, useCallback } from "react"

interface UseTravelAssistantProps {
    onFieldUpdate: (fields: Record<string, unknown>) => void;
}

export function useTravelAssistant({ onFieldUpdate }: UseTravelAssistantProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [hasGeneratedData, setHasGeneratedData] = useState(false)
    const [activeField, setActiveField] = useState<string | null>(null)
    const [extractionError, setExtractionError] = useState<string | null>(null)
    const [transcript, setTranscript] = useState("")

    const socketRef = useRef<WebSocket | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const pendingTranscriptRef = useRef("")
    const accumulatedArgsRef = useRef("")

    // Utility to parse partial JSON
    const parsePartialJson = (jsonString: string) => {
        try {
            // 1. Try parsing full string first
            return JSON.parse(jsonString);
        } catch (e) {
            // 2. If fails, try to salvage complete keys
            // This is a simple regex-based approach for "ghost typing"
            const result: Record<string, string | number | boolean | null> = {};
            
            // Match "key": "value" patterns (Complete)
            const stringRegex = /"([^"]+)":\s*"([^"]*)"/g;
            let match;
            while ((match = stringRegex.exec(jsonString)) !== null) {
                result[match[1]] = match[2];
            }

            // Match "key": "partial_value (Incomplete/Streaming)
            // This captures the value currently being typed at the very end of the string
            const incompleteStringRegex = /"([^"]+)":\s*"([^"]*)$/;
            const incompleteMatch = incompleteStringRegex.exec(jsonString);
            if (incompleteMatch) {
                result[incompleteMatch[1]] = incompleteMatch[2];
            }

            // Match "key": number/boolean/null
            const primitiveRegex = /"([^"]+)":\s*(true|false|null|\d+(\.\d+)?)/g;
            while ((match = primitiveRegex.exec(jsonString)) !== null) {
                const val = match[2];
                if (val === 'true') result[match[1]] = true;
                else if (val === 'false') result[match[1]] = false;
                else if (val === 'null') result[match[1]] = null;
                else result[match[1]] = Number(val);
            }
            
            return Object.keys(result).length > 0 ? result : null;
        }
    }

    const convertFloat32ToInt16 = (buffer: Float32Array) => {
        let l = buffer.length;
        const buf = new Int16Array(l);
        while (l--) {
            buf[l] = Math.min(1, Math.max(-1, buffer[l])) * 0x7FFF;
        }
        return buf.buffer;
    }

    const stopRecording = useCallback(() => {
        if (processorRef.current && audioContextRef.current) {
            processorRef.current.disconnect();
            audioContextRef.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (socketRef.current) {
            socketRef.current.close()
        }
        setIsRecording(false)
    }, [])

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            
            // Connect to WebSocket
            const webSocketEndpoint = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

            if (webSocketEndpoint) {
                const socket = new WebSocket(webSocketEndpoint);
                socketRef.current = socket

                socket.onopen = () => {
                    setIsRecording(true)
                    setHasGeneratedData(false)
                    setExtractionError(null)
                    setTranscript("") // Reset transcript
                    accumulatedArgsRef.current = "" // Reset args buffer

                    // Setup Audio Context with native sample rate
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    const audioContext = new AudioContextClass(); // No sampleRate constraint to avoid mismatch
                    audioContextRef.current = audioContext;

                    const source = audioContext.createMediaStreamSource(stream);
                    // Increased buffer size to 4096 to reduce main thread load
                    const processor = audioContext.createScriptProcessor(4096, 1, 1);
                    processorRef.current = processor;

                    // Downsampler: simple linear interpolation
                    const downsampleBuffer = (buffer: Float32Array, inputRate: number, outputRate: number) => {
                        if (outputRate === inputRate) return buffer;
                        if (outputRate > inputRate) throw new Error("Upsampling not supported");
                        
                        const sampleRateRatio = inputRate / outputRate;
                        const newLength = Math.round(buffer.length / sampleRateRatio);
                        const result = new Float32Array(newLength);
                        
                        for (let i = 0; i < newLength; i++) {
                            const nextIndex = Math.round(i * sampleRateRatio);
                            // Simple nearest neighbor / drop sample for speed. 
                            // Linear interpolation can be added if quality is too low, but for speech detection this is usually fine and faster.
                             result[i] = buffer[Math.min(nextIndex, buffer.length - 1)]; 
                        }
                        return result;
                    }

                    let chunkCount = 0;
                    processor.onaudioprocess = (e) => {
                        if (socket.readyState === WebSocket.OPEN) {
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Downsample to 24kHz if needed
                            const targetRate = 24000;
                            const downsampledData = downsampleBuffer(inputData, audioContext.sampleRate, targetRate);

                            const pcm16Data = convertFloat32ToInt16(downsampledData);
                            socket.send(pcm16Data);
                            
                            chunkCount++;
                        }
                    };

                    source.connect(processor);
                    processor.connect(audioContext.destination); // Required for Chrome to fire events
                }

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)
                        
                        // Handle Transcript Updates
                        if (data.type === 'response.audio_transcript.delta') {
                            pendingTranscriptRef.current += data.delta
                        }
                        
                        // Handle Response Done (Check for errors)
                        if (data.type === 'response.done') {
                            if (data.response && data.response.status === 'failed') {
                                setExtractionError(`AI Error: ${data.response.status_details?.error?.message || "Unknown error"}`);
                            }
                        }

                        // Handle Function Call Deltas (Ghost Typing)
                        if (data.type === 'response.function_call_arguments.delta') {
                            accumulatedArgsRef.current += data.delta;
                            const partialArgs = parsePartialJson(accumulatedArgsRef.current);
                            
                            if (partialArgs) {
                                setHasGeneratedData(true); // Show banner as soon as we have data
                                
                                // Identify active field (heuristic: the last key in the partial args)
                                const keys = Object.keys(partialArgs);
                                if (keys.length > 0) {
                                    const lastKey = keys[keys.length - 1];
                                    // Map JSON key to Form Field name for highlighting
                                    const fieldMap: Record<string, string> = {
                                        'full_name': 'clientName',
                                        'client_type': 'clientType',
                                        'budget': 'budget',
                                        'email': 'email',
                                        'travel_date': 'travelDate',
                                        'destination': 'destination',
                                        'birthday': 'birthday',
                                        'phone_number': 'phoneNumber',
                                        'commission': 'commission',
                                        'membership': 'membership',
                                        'origin': 'origin',
                                        'travel_style': 'style',
                                        'notes': 'notes'
                                    };
                                    if (fieldMap[lastKey]) {
                                        setActiveField(fieldMap[lastKey]);
                                        // Clear highlight after a short delay
                                        setTimeout(() => setActiveField(null), 1500);
                                    }
                                }

                                onFieldUpdate(partialArgs)
                            }
                        }

                        // Handle Function Calls Done (Final Polish)
                        if (data.type === 'response.function_call_arguments.done') {
                            let args = {};
                            try {
                                args = JSON.parse(data.arguments);
                            } catch (parseError) {
                                return; // Skip update if JSON is invalid
                            }
                            
                            setHasGeneratedData(true)
                            onFieldUpdate(args)
                        }
                    } catch (e) {
                        console.error("Error parsing WebSocket message:", e)
                    }
                }

                socket.onerror = (error) => {
                    console.error('WebSocket Error:', error)
                    setExtractionError("Connection error. Ensure backend is running.")
                    stopRecording()
                }

                socket.onclose = () => {
                    setIsRecording(false)
                }
            }

        } catch (err) {
            console.error('Error accessing microphone:', err)
            setExtractionError("Could not access microphone.")
        }
    }, [onFieldUpdate, stopRecording])

    const toggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }, [isRecording, startRecording, stopRecording])

    const reset = useCallback(() => {
        setTranscript("")
        pendingTranscriptRef.current = ""
        accumulatedArgsRef.current = ""
        setHasGeneratedData(false)
        setExtractionError(null)
    }, [])

    useEffect(() => {
        // Throttled transcript updates to prevent UI jank
        const interval = setInterval(() => {
            if (pendingTranscriptRef.current) {
                setTranscript(prev => prev + pendingTranscriptRef.current)
                pendingTranscriptRef.current = ""
            }
        }, 100)
    
        return () => {
            clearInterval(interval)
            stopRecording()
        }
    }, [stopRecording])

    return {
        isRecording,
        toggleRecording,
        stopRecording,
        transcript,
        activeField,
        hasGeneratedData,
        extractionError,
        reset
    }
}
