import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const chatWithAI = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request format. "messages" array is required.' 
      });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are AILifeOS Assistant — a precise, knowledgeable personal productivity AI built into AILifeOS, a personal operating system for tasks, goals, notes, focus, and life management.

RESPONSE RULES (follow strictly):
- Be concise and structured. No filler phrases like "Great question!" or "Certainly!".
- Use **markdown** formatting: headers (## or ###), bullet lists, numbered lists, bold, inline code, and fenced code blocks.
- Use bullet points for lists. Never use ASCII pipe-table art.
- Break complex answers into clearly labeled sections with ## headings.
- For code, always use fenced code blocks with the language identifier (e.g. \`\`\`js).
- Keep responses focused — never repeat the user's question back.
- End with a short, specific action suggestion or follow-up question when relevant.
- Always tailor advice to a developer/student building AILifeOS, focused on frontend development, DSA, and career goals.`
        },
        ...messages
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0.65,
      max_tokens: 900,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || '';

    res.status(200).json({
      success: true,
      message: responseContent,
    });
  } catch (error) {
    console.error('Groq AI Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process AI request.',
      error: error.message 
    });
  }
};
