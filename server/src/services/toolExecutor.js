import { logger } from '../utils/logger.js';
import { getSession } from './memory.service.js';
import { chatWithAgent } from './gemini.service.js';

export const executeTool = async (clientWs, functionCallEvent, sessionId) => {
  const { name, call_id, arguments: argsString } = functionCallEvent;
  
  let args = {};
  try {
    args = JSON.parse(argsString);
  } catch (err) {
    logger.error(`[ToolExecutor] Failed to parse args for ${name}`);
    return { error: 'Invalid JSON arguments' };
  }

  logger.info(`[ToolExecutor] Executing ${name} for session ${sessionId}`);

  try {
    // 1. SERVER-SIDE TOOLS
    if (name === 'generate_study_notes') {
      const { topic, depth } = args;
      const prompt = `Generate ${depth} study notes about ${topic} in markdown format with clear headings and bullet points.`;
      const result = await chatWithAgent({ message: prompt, systemInstruction: 'You are an expert tutor writing concise markdown notes.' });
      return { success: true, markdown: result.text };
    }

    if (name === 'explain_topic') {
      const { topic, level } = args;
      const prompt = `Explain ${topic} at a ${level || 'beginner'} level in exactly 2 short sentences in Hinglish.`;
      const result = await chatWithAgent({ message: prompt, systemInstruction: 'You are a helpful tutor explaining concepts briefly.' });
      return { success: true, explanation: result.text };
    }

    if (name === 'get_dashboard_summary') {
      // For Phase 1, just return a mock response or what's in memory.
      return { success: true, message: "Dashboard summary retrieved." };
    }

    // 2. CLIENT-SIDE TOOLS (relayed via WS)
    // Send request to client via the same WebSocket
    return await relayToolToClient(clientWs, call_id, name, args);

  } catch (error) {
    logger.error(`[ToolExecutor] Error executing ${name}:`, error);
    return { error: error.message };
  }
};

/**
 * Relays a tool execution request to the connected client via WebSocket,
 * waiting for a response payload with a matching call_id.
 */
const relayToolToClient = (clientWs, callId, name, args) => {
  return new Promise((resolve) => {
    if (!clientWs || clientWs.readyState !== 1) { // 1 = OPEN
      return resolve({ error: 'Client WebSocket not connected' });
    }

    // Prepare timeout in case client doesn't respond
    const timeout = setTimeout(() => {
      clientWs.removeEventListener('message', messageHandler);
      resolve({ error: 'Client execution timeout (4000ms)' });
    }, 4000);

    // One-time listener for this specific callId
    const messageHandler = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'client_tool_result' && data.call_id === callId) {
          clearTimeout(timeout);
          clientWs.removeEventListener('message', messageHandler);
          resolve(data.result);
        }
      } catch (err) {
        // Ignore non-JSON messages
      }
    };

    clientWs.addEventListener('message', messageHandler);

    // Dispatch the request to the client
    clientWs.send(JSON.stringify({
      type: 'client_tool_request',
      call_id: callId,
      name,
      args
    }));
  });
};
