// Single source of truth for the AI model, so every feature stays in sync and
// a provider deprecation is a one-line change.
//
// History: flashcard generation used to hardcode `llama3-8b-8192`, which Groq
// has since decommissioned — that endpoint failed in production while every
// other AI feature worked.
export const AI_MODEL = 'openai/gpt-oss-20b';

export default AI_MODEL;
