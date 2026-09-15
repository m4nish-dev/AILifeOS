import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined in .env');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Standard request for quick greetings or simple tool processing
 */
export const chatWithAgent = async ({ history = [], systemInstruction, message, tools = [] }) => {
  const modelOptions = {
    model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    systemInstruction,
  };

  if (tools.length > 0) {
    modelOptions.tools = [{ functionDeclarations: tools }];
  }

  const model = getGenAI().getGenerativeModel(modelOptions);
  
  const chat = model.startChat({ history });

  const result = await chat.sendMessage(message);
  const response = result.response;
  
  const functionCalls = response.functionCalls();
  
  return {
    text: response.text(),
    toolCalls: functionCalls || [],
  };
};

/**
 * SSE streaming request for primary conversational turns
 */
export const streamChatWithAgent = async ({ history = [], systemInstruction, message, tools = [] }, res) => {
  const modelOptions = {
    model: tools.length > 0 ? 'gemini-2.0-flash-exp' : 'gemini-2.0-flash',
    systemInstruction,
  };

  if (tools.length > 0) {
    modelOptions.tools = [{ functionDeclarations: tools }];
  }

  const model = getGenAI().getGenerativeModel(modelOptions);
  
  const chat = model.startChat({ history });

  const result = await chat.sendMessageStream(message);

  let accumulatedText = '';
  let accumulatedToolCalls = [];
  
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      accumulatedText += chunkText;
      res.write(`data: ${JSON.stringify({ type: 'text', content: chunkText })}\n\n`);
    }

    const functionCalls = chunk.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      accumulatedToolCalls.push(...functionCalls);
      res.write(`data: ${JSON.stringify({ type: 'tool_calls', calls: functionCalls })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  res.end();

  return {
    text: accumulatedText,
    toolCalls: accumulatedToolCalls
  };
};
