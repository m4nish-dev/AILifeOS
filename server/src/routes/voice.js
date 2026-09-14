import express from 'express';
import { buildAgentSettings } from '../config/agentConfig.js';
import { createSession } from '../services/memory.service.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/voice/session
 * Initializes a new voice session, returning the initial Settings payload.
 */
router.post('/session', (req, res) => {
  try {
    const { userId, userName, context, isFirstLogin } = req.body;
    const sessionId = uuidv4();
    
    // Track session in memory
    createSession(sessionId, userId, userName);

    // Build the Deepgram settings JSON for the client to send via WS
    const settings = buildAgentSettings({
      userName: userName || 'User',
      contextSnapshot: context,
      isFirstLogin: isFirstLogin === true
    });

    res.json({
      sessionId,
      wsUrl: `${process.env.PUBLIC_SERVER_URL?.replace('http', 'ws') || 'ws://localhost:5001'}/ws/voice`,
      initialSettings: settings
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create voice session' });
  }
});

export default router;
