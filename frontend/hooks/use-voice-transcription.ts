"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export const useVoiceTranscription = (onTranscript: (transcript: string, isFinal: boolean) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isReadyRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "commit_audio" }));
      }
      socketRef.current.close();
      socketRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsReady(false);
    isReadyRef.current = false;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsReady(false);
      isReadyRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Derive WebSocket URL from API base URL
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      let wsUrl = "";
      
      if (apiBaseUrl.startsWith("http")) {
        // If API base URL is http://localhost:8000/api, we want ws://localhost:8000/ws/transcription/
        const url = new URL(apiBaseUrl);
        const protocol = url.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${url.host}/ws/transcription/`;
      } else {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${window.location.host}/ws/transcription/`;
      }


      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {

        setIsRecording(true);
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "session_ready") {

            setIsReady(true);
            isReadyRef.current = true;
          } else if (data.type === "transcription") {

            onTranscript(data.transcript, data.is_final);
          } else if (data.type === "error") {
            setError(data.message);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      socketRef.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("WebSocket connection failed");
        stopRecording();
      };

      socketRef.current.onclose = () => {

        setIsRecording(false);
        setIsReady(false);
        isReadyRef.current = false;
      };

      // Set up AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass(); // No sampleRate constraint to avoid mismatch
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      // ScriptProcessor is deprecated but widely supported. 
      // For a more robust implementation, AudioWorklet would be better.
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const downsampleBuffer = (buffer: Float32Array, inputRate: number, outputRate: number) => {
        if (outputRate === inputRate) return buffer;
        if (outputRate > inputRate) throw new Error("Upsampling not supported");
        
        const sampleRateRatio = inputRate / outputRate;
        const newLength = Math.round(buffer.length / sampleRateRatio);
        const result = new Float32Array(newLength);
        
        for (let i = 0; i < newLength; i++) {
            const nextIndex = Math.round(i * sampleRateRatio);
            result[i] = buffer[Math.min(nextIndex, buffer.length - 1)]; 
        }
        return result;
      };

      const convertFloat32ToInt16 = (buffer: Float32Array) => {
        let l = buffer.length;
        const buf = new Int16Array(l);
        while (l--) {
            buf[l] = Math.min(1, Math.max(-1, buffer[l])) * 0x7FFF;
        }
        return buf.buffer;
      };

      processor.onaudioprocess = (e) => {
        if (socketRef.current?.readyState === WebSocket.OPEN && isReadyRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Downsample to 24kHz
          const targetRate = 24000;
          const downsampledData = downsampleBuffer(inputData, audioContext.sampleRate, targetRate);
          const pcm16Data = convertFloat32ToInt16(downsampledData);
          
          socketRef.current.send(pcm16Data);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Could not access microphone. Please ensure permissions are granted.");
    }
  }, [onTranscript, stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isReady,
    error,
    startRecording,
    stopRecording,
  };
};
