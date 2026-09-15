import express from 'express';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { chatWithAgent, streamChatWithAgent } from '../services/gemini.service.js';
import { getSession, appendTurn, appendToolResult, setUserProfile } from '../services/memory.service.js';
import { buildSystemPrompt } from '../utils/prompt.js';
import { AGENT_TOOLS_OPENAI_FORMAT as AGENT_TOOLS } from '../tools/registry.js';
import { lastSessionDebug } from '../ws/voiceAgentBridge.js';

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(limiter);

/**
 * POST /api/agent/greet
 * Returns a personalized Hinglish greeting.
 */
router.post('/greet', async (req, res) => {
  try {
    const { userId, isFirstLogin, context, userName = 'Dost' } = req.body;
    const sessionId = uuidv4();
    
    setUserProfile(sessionId, { userId, userName });

    const systemInstruction = buildSystemPrompt({ userName, currentDashboardState: context || {} });
    
    let message = "I just logged in. Greet me briefly in Hinglish.";
    if (isFirstLogin) {
      message = "I just logged in for the first time today. Greet me and give a quick summary of my open tasks.";
    }

    const result = await chatWithAgent({
      systemInstruction,
      message
    });

    appendTurn(sessionId, message, result.text, result.toolCalls);

    res.json({
      sessionId,
      reply: result.text,
      toolCalls: result.toolCalls,
      audioHint: "hi-IN"
    });
  } catch (error) {
    console.error('Agent Greet Error:', error);
    res.status(500).json({ error: 'Failed to generate greeting' });
  }
});

/**
 * POST /api/agent/chat
 * Primary chat endpoint streaming via SSE.
 */
router.post('/chat', async (req, res) => {
  try {
    const { userId, sessionId, message, context, userName = 'Dost' } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = getSession(sessionId);
    const systemInstruction = buildSystemPrompt({ userName, currentDashboardState: context || {} });

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await streamChatWithAgent({
      history: session.history,
      systemInstruction,
      message,
      tools: AGENT_TOOLS
    }, res);

    // Save to memory after stream finishes
    appendTurn(sessionId, message, result.text, result.toolCalls);
  } catch (error) {
    console.error('Agent Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process chat' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Internal server error' })}\n\n`);
      res.end();
    }
  }
});

/**
 * POST /api/agent/tool-result
 * Feeds tool execution results back to Gemini for the next turn.
 */
router.post('/tool-result', async (req, res) => {
  try {
    const { sessionId, results, context, userName = 'Dost' } = req.body;
    
    if (!sessionId || !results) {
      return res.status(400).json({ error: 'sessionId and results are required' });
    }

    // results should be an array of { name, response }
    appendToolResult(sessionId, results);

    const session = getSession(sessionId);
    const systemInstruction = buildSystemPrompt({ userName, currentDashboardState: context || {} });

    // We send an empty message or prompt the agent to continue based on tool results
    // Gemini handles tool_response by passing it in history and continuing the chat.
    // By passing an empty message to the next turn, Gemini will generate the follow up text.
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await streamChatWithAgent({
      history: session.history,
      systemInstruction,
      message: "Tool executed. Acknowledge briefly.",
      tools: AGENT_TOOLS
    }, res);

    appendTurn(sessionId, null, result.text, result.toolCalls);

  } catch (error) {
    console.error('Agent Tool Result Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process tool result' });
    }
  }
});

/**
 * GET /api/agent/session/:sessionId
 * Returns conversation history.
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getSession(sessionId);
    res.json({ history: session.history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * POST /api/agent/text
 * Fallback endpoint for text-based interaction (bypasses Deepgram).
 */
router.post('/text', async (req, res) => {
  try {
    const { userId, sessionId, message, context, userName = 'Dost' } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = getSession(sessionId);
    const systemInstruction = buildSystemPrompt({ userName, currentDashboardState: context || {} });

    const result = await chatWithAgent({
      history: session.history,
      systemInstruction,
      message,
      tools: AGENT_TOOLS
    });

    appendTurn(sessionId, message, result.text, result.toolCalls);

    res.json({
      reply: result.text,
      toolCalls: result.toolCalls
    });
  } catch (error) {
    console.error('Agent Text Fallback Error:', error);
    res.status(500).json({ error: 'Failed to process text fallback' });
  }
});

router.get('/debug/last-session', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Debug endpoints disabled in production' });
  }
  if (!lastSessionDebug) {
    return res.json({ message: 'No session data available yet' });
  }
  res.json(lastSessionDebug);
});

export default router;
