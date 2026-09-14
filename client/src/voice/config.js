export const AGENT_NAME_DEFAULT = "Jarvis";

export const WS_URL = import.meta.env.VITE_VOICE_WS_URL || "ws://localhost:5001/ws/voice";
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export const MIC_SAMPLE_RATE = 16000;
export const AGENT_SAMPLE_RATE = 24000;
export const MIC_FRAME_MS = 20;
export const VAD_INTERRUPT_THRESHOLD_MS = 180;

export const AVAILABLE_VOICES = [
  { id: "aura-2-asteria-en", label: "Asteria (Warm, friendly, mid-20s)" },
  { id: "aura-2-luna-en", label: "Luna (Bright, energetic)" },
  { id: "aura-2-stella-en", label: "Stella (Professional, sharp)" }
];
