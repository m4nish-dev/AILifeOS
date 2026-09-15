import WebSocket from 'ws';
import { logger } from '../utils/logger.js';
import { executeTool } from '../services/toolExecutor.js';

export let lastSessionDebug = null;

export const handleVoiceAgentConnection = (clientWs, req) => {
  const sessionId = "session-" + Math.random().toString(36).substr(2, 9);
  
  let state = 'CONNECTING'; // CONNECTING -> SETTINGS_SENT -> SETTINGS_APPLIED -> READY -> CLOSED
  let messageBuffer = [];
  
  const debugData = {
    sessionId,
    startTime: Date.now(),
    transitions: [{ state, time: Date.now() }],
    sentToDeepgram: [],
    receivedFromDeepgram: [],
    closeCode: null,
    closeReason: null
  };
  lastSessionDebug = debugData;

  const sessionStats = {
    turns: 0,
    toolCalls: 0,
    errors: 0,
    startTime: Date.now(),
    lastThinkingTime: 0,
    firstAudioMsAgg: 0
  };

  const setState = (newState) => {
    state = newState;
    debugData.transitions.push({ state, time: Date.now() });
    logger.debug({ event: 'STATE_CHANGE', sessionId, state }, `[VoiceAgentBridge] State -> ${state}`);
  };

  logger.info({ event: 'WS_CONNECT', sessionId }, '[VoiceAgentBridge] Client connected to WS');
  
  const dgUrl = 'wss://agent.deepgram.com/v1/agent/converse';
  const dgToken = process.env.DEEPGRAM_API_KEY;

  if (!dgToken) {
    logger.error({ event: 'DEEPGRAM_AUTH_ERROR', sessionId }, 'DEEPGRAM_API_KEY is missing');
    clientWs.close(1011, 'Server misconfigured');
    return;
  }

  const dgWs = new WebSocket(dgUrl, {
    headers: {
      'Authorization': `Token ${dgToken}`
    }
  });

  let heartbeatInterval = null;

  const sendToDeepgram = (data, options = {}) => {
    if (dgWs.readyState === WebSocket.OPEN) {
      if (options.binary) {
        debugData.sentToDeepgram.push({ type: 'BINARY_AUDIO', size: data.byteLength, time: Date.now() });
      } else {
        const payload = data.toString();
        try {
          const parsed = JSON.parse(payload);
          const scrubbed = { ...parsed };
          if (scrubbed.type === 'Settings') scrubbed.agent = '{redacted}';
          debugData.sentToDeepgram.push({ type: 'JSON', payload: scrubbed, time: Date.now() });
        } catch (e) {
          debugData.sentToDeepgram.push({ type: 'TEXT', payload: data.toString(), time: Date.now() });
        }
      }
      dgWs.send(data, options);
    }
  };

  // 1. Deepgram WS Events
  dgWs.on('open', () => {
    logger.info({ event: 'DEEPGRAM_CONNECT', sessionId }, '[VoiceAgentBridge] Connected to Deepgram Voice Agent');
    setState('SETTINGS_SENT');
  });

  dgWs.on('message', async (data, isBinary) => {
    // Pipe back to client immediately
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data, { binary: isBinary });
    }

    if (isBinary) {
      if (sessionStats.lastThinkingTime > 0) {
        const latencyMs = Date.now() - sessionStats.lastThinkingTime;
        sessionStats.firstAudioMsAgg += latencyMs;
        sessionStats.lastThinkingTime = 0;
        logger.info({ event: 'FIRST_AUDIO', sessionId, latencyMs }, '[VoiceAgentBridge] First audio received');
      }
      debugData.receivedFromDeepgram.push({ type: 'BINARY_AUDIO', size: data.byteLength, time: Date.now() });
    } else {
      try {
        const msg = JSON.parse(data.toString());
        debugData.receivedFromDeepgram.push({ type: 'JSON', payload: msg, time: Date.now() });
        
        switch (msg.type) {
          case 'SettingsApplied':
            logger.info({ event: 'SETTINGS_APPLIED', sessionId }, '[VoiceAgentBridge] Deepgram applied settings');
            setState('SETTINGS_APPLIED');
            setState('READY');
            
            // Start heartbeat ONLY after READY
            heartbeatInterval = setInterval(() => {
              if (dgWs.readyState === WebSocket.OPEN && state === 'READY') {
                sendToDeepgram(JSON.stringify({ type: 'KeepAlive' }));
              }
            }, 8000);

            // Flush buffered messages
            if (messageBuffer.length > 0) {
              logger.info({ event: 'FLUSH_BUFFER', sessionId, count: messageBuffer.length }, '[VoiceAgentBridge] Flushing buffered messages');
              messageBuffer.forEach(({ data, isBinary }) => {
                sendToDeepgram(data, { binary: isBinary });
              });
              messageBuffer = [];
            }
            break;

          case 'FunctionCallRequest':
            sessionStats.toolCalls++;
            logger.info({ event: 'TOOL_CALL', sessionId, tool: msg.function_name }, `[VoiceAgentBridge] Received FunctionCallRequest: ${msg.function_name}`);
            const result = await executeTool(clientWs, {
              call_id: msg.function_call_id,
              name: msg.function_name,
              arguments: msg.function_args
            }, sessionId);

            const resPayload = JSON.stringify({
              type: 'FunctionCallResponse',
              function_call_id: msg.function_call_id,
              output: JSON.stringify(result)
            });
            sendToDeepgram(resPayload);
            break;

          case 'Error':
            sessionStats.errors++;
            logger.error({ event: 'DEEPGRAM_ERROR', sessionId, msg }, `[VoiceAgentBridge] Deepgram Error: ${JSON.stringify(msg)}`);
            break;

          case 'Warning':
            logger.warn({ event: 'DEEPGRAM_WARN', sessionId, msg }, `[VoiceAgentBridge] Deepgram Warning`);
            break;
            
          case 'AgentThinking':
            sessionStats.turns++;
            sessionStats.lastThinkingTime = Date.now();
            logger.debug({ event: 'AGENT_THINKING', sessionId }, '[VoiceAgentBridge] DG Event: AgentThinking');
            break;

          default:
            if (['UserStartedSpeaking', 'AgentAudioDone'].includes(msg.type)) {
              logger.debug({ event: `DG_${msg.type.toUpperCase()}`, sessionId }, `[VoiceAgentBridge] DG Event: ${msg.type}`);
            }
        }
      } catch (err) {
        // Not a JSON message, or parse failed
      }
    }
  });

  const logSessionSummary = () => {
    const avgLatency = sessionStats.turns > 0 ? Math.round(sessionStats.firstAudioMsAgg / sessionStats.turns) : 0;
    const duration = Math.round((Date.now() - sessionStats.startTime) / 1000);
    logger.info({ 
      event: 'SESSION_SUMMARY', 
      sessionId, 
      turns: sessionStats.turns, 
      toolCalls: sessionStats.toolCalls, 
      errors: sessionStats.errors,
      avgLatencyMs: avgLatency,
      durationSec: duration
    }, '[VoiceAgentBridge] Session closed');
  };

  dgWs.on('close', (code, reason) => {
    setState('CLOSED');
    debugData.closeCode = code;
    debugData.closeReason = reason.toString();
    
    logger.info({ event: 'DEEPGRAM_CLOSE', sessionId, code, reason: reason.toString(), wasClean: code === 1000 }, '[VoiceAgentBridge] Deepgram WS closed');
    
    if (code === 1005 && !reason.toString()) {
      logger.error({ event: 'DEEPGRAM_CLOSE_1005', sessionId, lastSent: debugData.sentToDeepgram.slice(-3) }, '[VoiceAgentBridge] Deepgram closed 1005. Check last sent messages.');
    }
    
    clearInterval(heartbeatInterval);
    logSessionSummary();
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(code === 1000 ? 1000 : 1011, code === 1000 ? 'Client disconnected' : 'Upstream error');
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
    if (!isBinary) {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'pong' }));
          }
          return;
        }
        
        if (msg.type === 'InjectAgentMessage') {
          logger.info('[VoiceAgentBridge] Injecting agent message (TTS)');
          const ttsPayload = JSON.stringify({ type: 'Speak', text: msg.content });
          if (state === 'READY') {
            sendToDeepgram(ttsPayload);
          } else {
            messageBuffer.push({ data: ttsPayload, isBinary: false });
          }
          return; // Do not pass the raw InjectAgentMessage to Deepgram
        }
        
        if (msg.type === 'Settings') {
          // Special case for initial Settings payload which kicks off the flow
          sendToDeepgram(data, { binary: false });
          return;
        }

        if (msg.type === 'update_prompt_context') {
          const instructions = `Current dashboard state (injected per turn):\n${JSON.stringify(msg.snapshot, null, 2)}\nUse this to answer questions like "aaj kitne tasks hain?" or "mera goal kitna complete hai?" without calling a tool.`;
          const updatePayload = JSON.stringify({ type: 'UpdateInstructions', instructions });
          if (state === 'READY') {
            sendToDeepgram(updatePayload);
          } else {
            messageBuffer.push({ data: updatePayload, isBinary: false });
          }
          return;
        }
        
      } catch (err) {}
    }

    if (state === 'READY') {
      sendToDeepgram(data, { binary: isBinary });
    } else {
      // Buffer messages sent before READY
      messageBuffer.push({ data, isBinary });
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
