import express from 'express';
import { handleThinkProviderRequest } from '../ws/geminiThinkProvider.js';

const router = express.Router();

/**
 * Middleware to check internal Think Bearer token
 */
const requireThinkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.THINK_INTERNAL_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({ error: { message: "Internal server error: THINK_INTERNAL_TOKEN not configured" } });
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }

  next();
};

/**
 * POST /think/v1/chat/completions
 * Acts as an OpenAI-compatible Chat Completions endpoint, backed by Gemini.
 * Deepgram calls this to get reasoning and function calls.
 */
router.post('/v1/chat/completions', requireThinkAuth, handleThinkProviderRequest);

export default router;
