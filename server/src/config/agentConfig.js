import { buildSystemPrompt } from './personaPrompt.js';
import { AGENT_TOOLS_OPENAI_FORMAT } from '../tools/registry.js';
import { logger } from '../utils/logger.js';

export const buildAgentSettings = ({ userName, contextSnapshot, voiceModel, isFirstLogin, languageMix = 0.5 }) => {
  const publicUrl = process.env.PUBLIC_SERVER_URL || 'http://localhost:5001';
  
  if (publicUrl.includes('localhost') || publicUrl.includes('127.0.0.1')) {
    logger.warn('[AgentConfig] LOUD WARNING: PUBLIC_SERVER_URL is set to localhost! Deepgram cannot reach your local machine. Please use ngrok or cloudflared and update your .env.');
  }

  if (!process.env.THINK_INTERNAL_TOKEN) {
    throw new Error('THINK_INTERNAL_TOKEN is missing in environment variables.');
  }

  // Ensure functions array is flat and <= 20
  let functions = Array.isArray(AGENT_TOOLS_OPENAI_FORMAT) ? [...AGENT_TOOLS_OPENAI_FORMAT] : [];
  // Some versions wrapped tools in { type: 'function', function: {...} }. Deepgram expects a flat array of function specs.
  functions = functions.map(f => f.type === 'function' ? f.function : f);
  
  if (functions.length > 20) {
    logger.warn(`[AgentConfig] Found ${functions.length} tools. Truncating to 20 to comply with Deepgram limits.`);
    functions = functions.slice(0, 20);
  }

  return {
    type: "Settings",
    audio: {
      input: { encoding: "linear16", sample_rate: 16000 },
      output: { encoding: "linear16", sample_rate: 24000, container: "none" }
    },
    agent: {
      language: "en",
      listen: {
        provider: {
          type: "deepgram",
          model: "nova-3",
          keyterms: ["Dhruv", "Nova", "AI LifeOS", "system design", "DBMS", "OOP", "React", "notes", "task", "goal", "focus"]
        }
      },
      think: {
        provider: {
          type: "open_ai",
          model: process.env.GEMINI_MODEL || "gemini-flash-latest",
          url: `${publicUrl}/think/v1/chat/completions`,
          headers: [
            { key: "Authorization", value: `Bearer ${process.env.THINK_INTERNAL_TOKEN}` }
          ]
        },
        prompt: buildSystemPrompt({ userName, currentDashboardState: contextSnapshot, isFirstLogin, languageMix }),
        functions: functions
      },
      speak: {
        provider: {
          type: "deepgram",
          model: voiceModel || process.env.DG_VOICE_MODEL || "aura-2-asteria-en"
        }
      },
      greeting: ""
    }
  };
};
