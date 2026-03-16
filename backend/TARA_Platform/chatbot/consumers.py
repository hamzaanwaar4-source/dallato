import json
import base64
import asyncio
import os
import logging
import aiohttp
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings

logger = logging.getLogger(__name__)

# Define the Tool Schema (Same as in views.py)
TRAVEL_TOOL = {
    "type": "function",
    "name": "onboard_travel_client",
    "description": "Extracts travel details from voice. Email should be captured as a standard address.",
    "parameters": {
        "type": "object",
        "properties": {
            "full_name": {"type": "string", "description": "The client's full name"},
            "client_type": {"type": "string", "description": "The demographic or relationship composition of the travelers. STRICTLY: 'Single', 'Couple', 'Family', 'Group', 'Corporate', 'Honeymooners', 'Retired'. NOT travel style."},
            "budget": {"type": "string", "description": "Budget range or specific amount e.g. '$5000', '$2000-$3000', '5000USD TO 10000USD'"},
            "destination": {"type": "string", "description": "Planned travel location"},
            "commission": {"type": "number", "description": "Commission percentage of the client (0-100). Do NOT include % sign."},
            "email": {"type": "string", "description": "The client's email address"},
            "travel_date": {"type": "string", "description": "Travel dates or duration"},
            "birthday": {"type": "string", "description": "Client's birthday in YYYY-MM-DD format"},
            "phone_number": {"type": "string", "description": "Client's phone number"},
            "origin": {"type": "string", "description": "Client's origin city/country"},
            "travel_preferences": {
                "type": "array", 
                "items": {"type": "string"}, 
                "description": "List of travel preferences e.g. 'Beachfront', '5-Star', 'All-inclusive'"
            },
            "travel_style": {"type": "string", "description": "The desired vibe, pace, or experience of the trip. e.g. 'Luxury', 'Adventure', 'Relaxation', 'Cultural', 'All-inclusive'."},
            "membership": {"type": "string", "description": "The desired membership of the client. STRICTLY one of: 'GOLD', 'PLATINUM', 'SILVER'."},
            "notes": {"type": "string", "description": "General notes, dietary restrictions, mobility requirements, special occasions"},
            "group_family_members": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "type": {"type": "string", "enum": ["adult", "child"]},
                        "relation": {"type": "string", "description": "Relation to primary client e.g. 'spouse', 'son', 'friend'"}
                    },
                    "required": ["name", "type"]
                },
                "description": "List of family members or companions traveling with the client"
            }
        },
        "required": ["full_name", "email","client_type", "commission"]
    }
}

class TravelAssistantConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.openai_ws = None
        self.client_session = None
        self.api_key = os.environ.get("OPENAI_API_KEY")
        
        if not self.api_key:
            logger.error("OPENAI_API_KEY not found")
            await self.close(code=4000)
            return

        try:
            # Connect to OpenAI Realtime API
            url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "OpenAI-Beta": "realtime=v1",
            }
            
            self.client_session = aiohttp.ClientSession()
            self.openai_ws = await self.client_session.ws_connect(url, headers=headers)
            logger.info("Connected to OpenAI Realtime API")
            
            # Start receiving from OpenAI in background
            self.openai_task = asyncio.create_task(self.receive_from_openai())
            
            # Initialize Session with Tool
            await self.send_session_update()
            
        except Exception as e:
            logger.error(f"Failed to connect to OpenAI: {e}")
            await self.close(code=4001)

    async def disconnect(self, close_code):
        if hasattr(self, 'openai_task'):
            self.openai_task.cancel()
        if self.openai_ws:
            await self.openai_ws.close()
        if self.client_session:
            await self.client_session.close()
        logger.info("Disconnected")

    async def receive(self, text_data=None, bytes_data=None):
        if not self.openai_ws:
            logger.warning("OpenAI WS not connected, dropping message")
            return

        try:
            if bytes_data:
                # Log every 50th chunk to verify flow
                if not hasattr(self, 'chunk_count'):
                    self.chunk_count = 0
                self.chunk_count += 1
                if self.chunk_count % 50 == 0:
                    logger.info(f"Received {self.chunk_count} audio chunks from frontend")

                # Forward audio to OpenAI
                b64_audio = base64.b64encode(bytes_data).decode('utf-8')
                event = {
                    "type": "input_audio_buffer.append",
                    "audio": b64_audio
                }
                await self.openai_ws.send_str(json.dumps(event))
                
            elif text_data:
                logger.info(f"Received text data: {text_data}")
        except Exception as e:
            logger.error(f"Error sending to OpenAI: {e}")

    async def receive_from_openai(self):
        try:
            async for msg in self.openai_ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    event_type = data.get('type')
                    
                    # Log interesting events
                    if event_type == 'response.audio_transcript.done':
                        logger.info(f"Transcript: {data.get('transcript')}")
                    elif event_type == 'response.done':
                        response_data = data.get('response', {})
                        if response_data.get('status') == 'failed':
                            logger.error(f"OpenAI Response Failed: {response_data.get('status_details')}")
                    elif event_type == 'error':
                        logger.error(f"OpenAI Error Event: {data}")
                    
                    # Forward tool calls and transcript updates to frontend
                    if event_type in [
                        'response.done',
                        'response.function_call_arguments.delta',
                        'response.function_call_arguments.done',
                        'response.audio_transcript.delta',
                        'response.audio_transcript.done',
                        'error'
                    ]:
                        await self.send(text_data=json.dumps(data))
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error('OpenAI WS connection closed with error %s', self.openai_ws.exception())
                elif msg.type == aiohttp.WSMsgType.CLOSED:
                    logger.info('OpenAI WS connection closed normally')
                    break
                    
        except asyncio.CancelledError:
            logger.info("OpenAI task cancelled")
        except Exception as e:
            logger.exception(f"Error receiving from OpenAI: {e}")
        finally:
            logger.info("Exiting receive_from_openai loop")

    async def send_session_update(self):
        session_update = {
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": (
                    "You are a silent data extractor for a travel CRM. "
                    "1. Trigger `onboard_travel_client` immediately when you identify a field. "
                    "2. Do NOT provide conversational responses. "
                    "3. Extract only NEW information mentioned in the audio. "
                    "4. If a value is corrected (e.g., 'no, wait, let's go to Paris'), update the field accordingly. "
                    "5. STRICTLY ONLY extract information explicitly stated by the primary speaker. "
                    "6. IGNORE background noise, TV, or secondary conversations. "
                    "7. Do NOT infer or guess values. If a field is not explicitly mentioned, leave it null. "
                    "8. If the user is silent or the audio is irrelevant, do NOT output any function calls. "
                    "9. ALWAYS output in English. If the user speaks another language, translate it to English."
                ),
                "voice": "alloy",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1",
                    "language": "en"
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 2000
                },
                "tools": [TRAVEL_TOOL],
                "tool_choice": "auto",
                "max_response_output_tokens": 800 
            }
        }
        await self.openai_ws.send_str(json.dumps(session_update))


class AudioTranscriptionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for audio transcription only.
    Receives audio from frontend, sends to OpenAI Realtime API,
    and returns text transcripts without any tool calling.
    """
    
    async def connect(self):
        await self.accept()
        self.openai_ws = None
        self.client_session = None
        self.api_key = os.environ.get("OPENAI_API_KEY")
        
        if not self.api_key:
            logger.error("OPENAI_API_KEY not found")
            await self.close(code=4000)
            return

        try:
            # Connect to OpenAI Realtime API
            url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "OpenAI-Beta": "realtime=v1",
            }
            
            self.client_session = aiohttp.ClientSession()
            self.openai_ws = await self.client_session.ws_connect(url, headers=headers)
            logger.info("Connected to OpenAI Realtime API for transcription")
            
            # Start receiving from OpenAI in background
            self.openai_task = asyncio.create_task(self.receive_from_openai())
            
            # Initialize Session for transcription only
            await self.send_session_update()
            
        except Exception as e:
            logger.error(f"Failed to connect to OpenAI: {e}")
            await self.close(code=4001)

    async def disconnect(self, close_code):
        if hasattr(self, 'openai_task'):
            self.openai_task.cancel()
        if self.openai_ws:
            await self.openai_ws.close()
        if self.client_session:
            await self.client_session.close()
        logger.info("Transcription WebSocket disconnected")

    async def receive(self, text_data=None, bytes_data=None):
        if not self.openai_ws:
            logger.warning("OpenAI WS not connected, dropping message")
            return

        try:
            if bytes_data:
                # Log every 50th chunk to verify flow
                if not hasattr(self, 'chunk_count'):
                    self.chunk_count = 0
                self.chunk_count += 1
                if self.chunk_count % 50 == 0:
                    logger.info(f"Received {self.chunk_count} audio chunks from frontend")

                # Forward audio to OpenAI
                b64_audio = base64.b64encode(bytes_data).decode('utf-8')
                event = {
                    "type": "input_audio_buffer.append",
                    "audio": b64_audio
                }
                await self.openai_ws.send_str(json.dumps(event))
                
            elif text_data:
                logger.info(f"Received text data: {text_data}")
                data = json.loads(text_data)
                
                # Handle manual transcript commit if needed
                if data.get('type') == 'commit_audio':
                    commit_event = {
                        "type": "input_audio_buffer.commit"
                    }
                    await self.openai_ws.send_str(json.dumps(commit_event))
                    
        except Exception as e:
            logger.error(f"Error sending to OpenAI: {e}")

    async def receive_from_openai(self):
        try:
            async for msg in self.openai_ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    event_type = data.get('type')
                    
                    # Handle transcription events
                    if event_type == 'conversation.item.input_audio_transcription.completed':
                        transcript = data.get('transcript', '')
                        logger.info(f"Transcription completed: {transcript}")
                        
                        # Send clean transcript to frontend
                        await self.send(text_data=json.dumps({
                            'type': 'transcription',
                            'transcript': transcript,
                            'is_final': True
                        }))
                    
                    elif event_type == 'conversation.item.input_audio_transcription.failed':
                        logger.error(f"Transcription failed: {data}")
                        await self.send(text_data=json.dumps({
                            'type': 'error',
                            'message': 'Transcription failed'
                        }))
                    
                    # Optionally handle partial transcripts
                    elif event_type == 'response.audio_transcript.delta':
                        partial_transcript = data.get('delta', '')
                        logger.debug(f"Partial transcript: {partial_transcript}")
                        
                        await self.send(text_data=json.dumps({
                            'type': 'transcription',
                            'transcript': partial_transcript,
                            'is_final': False
                        }))
                    
                    elif event_type == 'response.audio_transcript.done':
                        final_transcript = data.get('transcript', '')
                        logger.info(f"Final transcript: {final_transcript}")
                        
                        await self.send(text_data=json.dumps({
                            'type': 'transcription',
                            'transcript': final_transcript,
                            'is_final': True
                        }))
                    
                    elif event_type == 'error':
                        logger.error(f"OpenAI Error Event: {data}")
                        await self.send(text_data=json.dumps({
                            'type': 'error',
                            'message': data.get('error', {}).get('message', 'Unknown error')
                        }))
                    
                    # Log session creation
                    elif event_type == 'session.created':
                        logger.info("OpenAI session created for transcription")
                        await self.send(text_data=json.dumps({
                            'type': 'session_ready',
                            'message': 'Ready to transcribe'
                        }))
                    
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error('OpenAI WS connection closed with error %s', self.openai_ws.exception())
                elif msg.type == aiohttp.WSMsgType.CLOSED:
                    logger.info('OpenAI WS connection closed normally')
                    break
                    
        except asyncio.CancelledError:
            logger.info("OpenAI transcription task cancelled")
        except Exception as e:
            logger.exception(f"Error receiving from OpenAI: {e}")
        finally:
            logger.info("Exiting receive_from_openai loop")

    async def send_session_update(self):
        """Initialize OpenAI session for transcription only - English language only"""
        session_update = {
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": (
                    "You are a transcription service. "
                    "Only transcribe what you hear in English. "
                    "If you detect non-English speech, translate it to English. "
                    "Do NOT respond or engage in conversation. "
                    "Do NOT use filler phrases like 'Understood' or 'You said'. "
                    "Do NOT call any functions or tools. "
                    "Always output transcriptions in English only. "
                    "Output ONLY the transcript text."
                ),
                "voice": "alloy",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1",
                    "language": "en"  # Force English transcription
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 700
                },
                "tools": [],
                "tool_choice": "none",
                "temperature": 0.8,
                "max_response_output_tokens": 50
            }
        }
        await self.openai_ws.send_str(json.dumps(session_update))
        logger.info("Session configured for English-only transcription")