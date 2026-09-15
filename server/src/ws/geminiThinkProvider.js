import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';
import { measureLatency, startTimer } from '../utils/latency.js';
import { v4 as uuidv4 } from 'uuid';

let genAI = null;
const getGenAI = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Handles incoming POST requests mapped to OpenAI's /v1/chat/completions format,
 * translating them into Gemini requests and streaming the response back via SSE.
 */
export const handleThinkProviderRequest = async (req, res) => {
  const startTime = startTimer();
  try {
    const { messages = [], tools = [], model = process.env.GEMINI_MODEL || "gemini-flash-latest", stream = false } = req.body;
    
    // Map OpenAI messages to Gemini contents
    // Deepgram/OpenAI roles: 'system', 'user', 'assistant', 'tool'
    // Gemini roles: 'user', 'model'
    let systemInstruction = "";
    const geminiHistory = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += msg.content + "\n";
      } else if (msg.role === 'user') {
        geminiHistory.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'assistant') {
        if (msg.tool_calls) {
          geminiHistory.push({
            role: 'model',
            parts: msg.tool_calls.map(tc => ({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments)
              }
            }))
          });
        } else {
          geminiHistory.push({ role: 'model', parts: [{ text: msg.content || "" }] });
        }
      } else if (msg.role === 'tool') {
        // OpenAI sends tool results with role: 'tool' and tool_call_id
        geminiHistory.push({
          role: 'user', // Gemini expects tool results to be from the 'user' role
          parts: [{
            functionResponse: {
              name: msg.name,
              response: { result: msg.content }
            }
          }]
        });
      }
    }

    // Map OpenAI tools to Gemini tool definitions
    // OpenAI tools format: { type: "function", function: { name, description, parameters } }
    let geminiTools = undefined;
    if (tools && tools.length > 0) {
      geminiTools = [{
        functionDeclarations: tools.map(t => t.function)
      }];
    }

    // Configure Gemini model instance
    const geminiModelConfig = { model };
    if (systemInstruction) {
      geminiModelConfig.systemInstruction = systemInstruction;
    }
    if (geminiTools) {
      geminiModelConfig.tools = geminiTools;
      // Use flash-exp if tools are present (as per user requirements originally, or just stick to requested model)
      geminiModelConfig.model = "gemini-2.0-flash-exp"; 
    }

    const geminiModel = getGenAI().getGenerativeModel(geminiModelConfig);
    
    // The last message in history is what we want to process, but Gemini's startChat requires history, 
    // and then sendMessage needs the final prompt.
    const historyWithoutLast = geminiHistory.slice(0, -1);
    const lastMessage = geminiHistory[geminiHistory.length - 1];

    const chat = geminiModel.startChat({ history: historyWithoutLast });
    
    logger.info(`[ThinkProvider] Invoking Gemini with ${historyWithoutLast.length} history items + new message`);

    if (!stream) {
      // Non-streaming fallback (not recommended for Deepgram latency, but supported)
      const result = await chat.sendMessage(lastMessage.parts);
      const response = result.response;
      
      const functionCalls = response.functionCalls();
      const openAiResponse = {
        id: `chatcmpl-${uuidv4()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.text() || null,
          },
          finish_reason: functionCalls?.length ? 'tool_calls' : 'stop'
        }]
      };

      if (functionCalls && functionCalls.length > 0) {
        openAiResponse.choices[0].message.tool_calls = functionCalls.map(fc => ({
          id: `call_${uuidv4()}`,
          type: 'function',
          function: {
            name: fc.name,
            arguments: JSON.stringify(fc.args)
          }
        }));
      }

      measureLatency(startTime, 'Non-Stream Completion');
      return res.json(openAiResponse);
    }

    // Streaming implementation
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await chat.sendMessageStream(lastMessage.parts);
    const cmplId = `chatcmpl-${uuidv4()}`;
    let firstToken = true;

    for await (const chunk of result.stream) {
      if (firstToken) {
        measureLatency(startTime, 'First Gemini Token');
        firstToken = false;
      }
      
      const chunkText = chunk.text();
      const chunkFunctionCalls = chunk.functionCalls();
      
      let delta = {};

      if (chunkText) {
        delta.content = chunkText;
      }
      
      if (chunkFunctionCalls && chunkFunctionCalls.length > 0) {
        delta.tool_calls = chunkFunctionCalls.map((fc, idx) => ({
          index: idx,
          id: `call_${uuidv4()}`,
          type: 'function',
          function: {
            name: fc.name,
            arguments: JSON.stringify(fc.args)
          }
        }));
      }

      // Stream the delta in OpenAI format
      const payload = {
        id: cmplId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          delta,
          finish_reason: null
        }]
      };
      
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }

    // Send final stop chunk
    res.write(`data: ${JSON.stringify({
      id: cmplId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        delta: {},
        finish_reason: "stop"
      }]
    })}\n\n`);
    
    res.write("data: [DONE]\n\n");
    res.end();

    measureLatency(startTime, 'Full Stream Completion');

  } catch (error) {
    logger.error('[ThinkProvider] Error processing request:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: { message: error.message } });
    } else {
      res.end();
    }
  }
};
