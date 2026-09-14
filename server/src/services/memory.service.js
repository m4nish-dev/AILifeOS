import { logger } from '../utils/logger.js';

// TODO: swap for Mongo in a future phase
const sessions = new Map();

const MAX_HISTORY = 30;

const createEmptySession = (userId, userName) => ({
  userId,
  userName,
  history: [],
  userProfile: null,
  createdAt: Date.now(),
  lastActiveAt: Date.now()
});

export const getSession = (sessionId) => {
  if (!sessions.has(sessionId)) {
    return null;
  }
  return sessions.get(sessionId);
};

export const createSession = (sessionId, userId, userName) => {
  const session = createEmptySession(userId, userName);
  sessions.set(sessionId, session);
  return session;
};

export const touchSession = (sessionId) => {
  const session = getSession(sessionId);
  if (session) {
    session.lastActiveAt = Date.now();
  }
};

export const appendTurn = (sessionId, userMessage, agentResponse, toolCalls = []) => {
  const session = getSession(sessionId);
  if (!session) return;
  
  touchSession(sessionId);

  // Append user message
  if (userMessage) {
    session.history.push({
      role: 'user',
      content: userMessage
    });
  }

  // Append agent response
  if (agentResponse || toolCalls.length > 0) {
    session.history.push({
      role: 'assistant',
      content: agentResponse || '',
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined
    });
  }

  // Trim history to keep only the last MAX_HISTORY turns (user + assistant pairs)
  if (session.history.length > MAX_HISTORY * 2) {
    session.history = session.history.slice(-(MAX_HISTORY * 2));
  }
};

export const appendToolResult = (sessionId, toolCallId, name, result) => {
  const session = getSession(sessionId);
  if (!session) return;
  
  touchSession(sessionId);

  session.history.push({
    role: 'tool',
    tool_call_id: toolCallId,
    name: name,
    content: typeof result === 'string' ? result : JSON.stringify(result)
  });
};

export const resetSession = (sessionId) => {
  if (sessions.has(sessionId)) {
    const s = sessions.get(sessionId);
    sessions.set(sessionId, createEmptySession(s.userId, s.userName));
  }
};

export const setUserProfile = (sessionId, profile) => {
  const session = getSession(sessionId);
  if (session) {
    session.userProfile = profile;
    touchSession(sessionId);
  }
};
