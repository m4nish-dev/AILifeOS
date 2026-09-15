# AILifeOS Voice Agent Architecture

This document describes the Phase 5 architecture of the AILifeOS Voice Agent, a real-time, Hinglish-capable AI assistant powered by Deepgram and Google Gemini 2.0 Flash.

## Architecture Overview

The system uses a WebSocket-based streaming architecture to achieve low-latency conversational AI.

1. **Client Layer (React)**:
   - Captures 16kHz PCM audio via Web Audio API (`MicStreamer.js`).
   - Streams audio over WebSocket to the local Node.js server.
   - Receives 24kHz PCM audio chunks and schedules them gap-free (`AgentAudioPlayer.js`).
   - Renders floating UI (`VoiceOrb`, `VoicePanel`, `LatencyHUD`).

2. **Server Layer (Node.js)**:
   - `voiceAgentBridge.js` intercepts client WebSocket connections and proxies them to the Deepgram Voice Agent API (`wss://agent.deepgram.com/v1/agent/converse`).
   - Translates tool execution requests.
   - Monitors latency and injects context updates.

3. **AI Layer (Deepgram + Gemini)**:
   - **STT**: Deepgram Nova-3 transcribes user speech in real-time.
   - **LLM**: Deepgram acts as an orchestrator, passing transcripts to Google Gemini 2.0 Flash (via the "think" provider integration).
   - **TTS**: Deepgram Aura-2 synthesizes Gemini's responses into natural, Hinglish audio.
   - **VAD & Endpointing**: Deepgram natively handles Voice Activity Detection and turn-taking.

## Data Flows

### Audio Streaming Loop
1. User speaks -> `MicStreamer` downsamples and sends binary WS frame to Server.
2. Server pipes binary frame to Deepgram WS.
3. Deepgram streams TTS audio chunks back to Server.
4. Server pipes chunks back to Client.
5. `AgentAudioPlayer` decodes Int16 to Float32 and plays via Web Audio API.

### Context Injection Loop
1. Client generates a dashboard snapshot (`dashboardSnapshot.js`) every 4 seconds when in 'listening' state.
2. Client sends `update_prompt_context` to Server.
3. Server formats snapshot and sends `UpdateInstructions` to Deepgram.
4. Gemini uses this latest context for the next conversational turn without needing to explicitly call a "get_dashboard" tool.

### Tool Execution Loop
1. Deepgram detects a tool call intent and sends `FunctionCallRequest` to Server.
2. Server handles server-side tools (e.g. MongoDB updates) OR forwards client-side tools (e.g. navigation, mock data mutations) to the Client.
3. Client executes `executeClientTool` (via `dataStore.js`), updates UI, and generates an `actionId` for undo capability.
4. Client sends `client_tool_result` back to Server.
5. Server sends `FunctionCallResponse` back to Deepgram.

## Reliability & Resiliency
- **Exponential Backoff**: `VoiceAgentSocket.js` reconnects on failure up to 4 times (400ms -> 3200ms).
- **Heartbeat (Ping/Pong)**: Client and Server exchange pings every 15s. Server and Deepgram exchange KeepAlive every 8s. Stale connections are forcefully recycled.
- **Latency Monitoring**: `LatencyHUD.js` tracks TTFB (Time to First Byte) and Turn Total time. Server logs aggregations via Pino.
- **Barge-in Hardening**: Client implements local RMS calculation (180ms threshold) to immediately flush audio and interrupt the agent if the user speaks, complementing Deepgram's native `UserStartedSpeaking` events.

## Error Taxonomy
Distinct error codes are caught and surfaced via `VoicePanel.jsx`:
- `MIC_PERMISSION_DENIED`: Browser mic access blocked.
- `MIC_DEVICE_MISSING`: No mic found.
- `WS_CONNECT_FAILED`: Socket connection error.
- `DEEPGRAM_AUTH_ERROR`: Missing API keys on server.

## Future Phases
- **MongoDB Integration**: Swap `dataStore.js` `localStorage` operations with REST API calls.
- **Deepgram API Enhancements**: Native speech rate controls once available in Aura API.
