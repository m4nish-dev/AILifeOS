import WebSocket from 'ws';
import { logger } from '../utils/logger.js';
import { executeTool } from '../services/toolExecutor.js';

export const handleVoiceAgentConnection = (clientWs, req) => {
  logger.info('[VoiceAgentBridge] Client connected to WS');
  
  // Create downstream connection to Deepgram
  const dgUrl = 'wss://agent.deepgram.com/v1/agent/converse';
  const dgToken = process.env.DEEPGRAM_API_KEY;

  if (!dgToken) {
    logger.error('DEEPGRAM_API_KEY is missing');
    clientWs.close(1011, 'Server misconfigured');
    return;
  }

  const dgWs = new WebSocket(dgUrl, {
    headers: {
      'Authorization': `Token ${dgToken}`
    }
  });

  let heartbeatInterval = null;

  // 1. Deepgram WS Events
  dgWs.on('open', () => {
    logger.info('[VoiceAgentBridge] Connected to Deepgram Voice Agent');
    // Start heartbeat
    heartbeatInterval = setInterval(() => {
      if (dgWs.readyState === WebSocket.OPEN) {
        dgWs.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 8000);
  });

  dgWs.on('message', async (data, isBinary) => {
    // Pipe back to client immediately
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data, { binary: isBinary });
    }

    if (!isBinary) {
      try {
        const msg = JSON.parse(data.toString());
        // Handle server-side intercepts
        switch (msg.type) {
          case 'FunctionCallRequest':
            logger.info(`[VoiceAgentBridge] Received FunctionCallRequest: ${msg.function_name}`);
            const result = await executeTool(clientWs, {
              call_id: msg.function_call_id,
              name: msg.function_name,
              arguments: msg.function_args
            }, "session-temp-id"); // In production, grab session ID from query or initial message

            if (dgWs.readyState === WebSocket.OPEN) {
              const resPayload = JSON.stringify({
                type: 'FunctionCallResponse',
                function_call_id: msg.function_call_id,
                output: JSON.stringify(result)
              });
              dgWs.send(resPayload);
            }
            break;

          case 'Error':
            logger.error(`[VoiceAgentBridge] Deepgram Error: ${JSON.stringify(msg)}`);
            break;

          case 'Warning':
            logger.warn(`[VoiceAgentBridge] Deepgram Warning: ${JSON.stringify(msg)}`);
            break;
            
          default:
            // Log other interesting events
            if (['AgentThinking', 'UserStartedSpeaking', 'AgentAudioDone'].includes(msg.type)) {
              logger.debug(`[VoiceAgentBridge] DG Event: ${msg.type}`);
            }
        }
      } catch (err) {
        // Not a JSON message, or parse failed
      }
    }
  });

  dgWs.on('close', (code, reason) => {
    logger.info(`[VoiceAgentBridge] Deepgram WS closed: ${code} ${reason}`);
    clearInterval(heartbeatInterval);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(1000, 'Upstream closed');
    }
  });

  dgWs.on('error', (err) => {
    logger.error(`[VoiceAgentBridge] Deepgram WS error: ${err.message}`);
    clearInterval(heartbeatInterval);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(1011, 'Upstream error');
    }
  });

  // 2. Client WS Events
  clientWs.on('message', (data, isBinary) => {
    // Pipe to Deepgram immediately
    if (dgWs.readyState === WebSocket.OPEN) {
      dgWs.send(data, { binary: isBinary });
    }
  });

  clientWs.on('close', () => {
    logger.info('[VoiceAgentBridge] Client WS closed');
    clearInterval(heartbeatInterval);
    if (dgWs.readyState === WebSocket.OPEN) {
      dgWs.close(1000, 'Client disconnected');
    }
  });

  clientWs.on('error', (err) => {
    logger.error(`[VoiceAgentBridge] Client WS error: ${err.message}`);
    clearInterval(heartbeatInterval);
    if (dgWs.readyState === WebSocket.OPEN) {
      dgWs.close(1011, 'Client error');
    }
  });
};
