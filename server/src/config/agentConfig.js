import { buildSystemPrompt } from './personaPrompt.js';
import { AGENT_TOOLS_OPENAI_FORMAT } from '../tools/registry.js';

export const buildAgentSettings = ({ userName, contextSnapshot, voiceModel, isFirstLogin, languageMix = 0.5 }) => {
  return {
    type: "Settings",
    audio: {
      input: { encoding: "linear16", sample_rate: 16000 },
      output: { encoding: "linear16", sample_rate: 24000, container: "none" }
    },
    agent: {
      language: "multi", // Deepgram Nova-3 handles Hinglish under "multi"
      listen: {
        provider: {
          type: "deepgram",
          model: "nova-3",
          keyterms: ["Dhruv", "Jarvis", "AI LifeOS", "system design", "DBMS", "OOP", "React", "notes", "task", "goal", "focus"]
        }
      },
      think: {
        provider: {
          type: "open_ai",
          model: "gemini-2.0-flash", // Deepgram will pass this to our custom /think endpoint
          url: `${process.env.PUBLIC_SERVER_URL || 'http://localhost:5001'}/think/v1/chat/completions`,
          headers: [{ key: "Authorization", value: `Bearer ${process.env.THINK_INTERNAL_TOKEN}` }]
        },
        prompt: buildSystemPrompt({ userName, contextSnapshot, isFirstLogin, languageMix }),
        functions: AGENT_TOOLS_OPENAI_FORMAT
      },
      speak: {
        provider: {
          type: "deepgram",
          model: voiceModel || process.env.DG_VOICE_MODEL || "aura-2-asteria-en"
        }
      },
      greeting: "" // greeting is handled dynamically per session in ws logic or via initial InjectAgentMessage
    }
  };
};
