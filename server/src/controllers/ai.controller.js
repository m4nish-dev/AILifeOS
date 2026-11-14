import Groq from 'groq-sdk';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { AI_MODEL } from '../config/ai.js';
import Conversation from '../models/Conversation.model.js';
import Task from '../models/Task.model.js';
import Goal from '../models/Goal.model.js';
import Event from '../models/Event.model.js';
import Note from '../models/Note.model.js';
import StudySession from '../models/StudySession.model.js';
import StudyGoal from '../models/StudyGoal.model.js';
import Flashcard from '../models/Flashcard.model.js';

// Groq client — lazy initialization so server never crashes on startup if key is pending
const getGroqClient = () => new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing_key"
});
const groq = new Proxy({}, {
  get: (target, prop) => getGroqClient()[prop]
});


// Guard used by every AI endpoint: without a key the feature cannot work, so
// say so plainly instead of surfacing a provider auth error as a 500.
const missingGroqKey = (res) => {
  if (process.env.GROQ_API_KEY) return false;
  res.status(503).json({
    success: false,
    message: 'AI features are not configured on this server. The GROQ_API_KEY environment variable is missing.',
  });
  return true;
};

// Parses a model response that is supposed to be JSON, tolerating markdown
// fences. Returns null instead of throwing so callers can answer cleanly.
const parseJsonResponse = (raw) => {
  if (!raw) return null;
  const cleaned = String(raw).replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

// Helper: Build context string for the AI based on live user data
const buildUserContext = async (userId) => {
  try {
    // 1. Tasks — count in the database instead of loading every task into
    // memory, and fetch only the few upcoming ones we actually mention.
    const [tasksTotal, done, inProgress, todo] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, status: 'done' }),
      Task.countDocuments({ userId, status: 'in-progress' }),
      Task.countDocuments({ userId, status: 'todo' }),
    ]);

    const upcomingTasks = await Task.find({
      userId,
      status: { $ne: 'done' },
      dueDate: { $ne: null },
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .select('title priority dueDate');

    // 2. Goals
    const activeGoals = await Goal.find({ userId, status: 'active' }).limit(10);

    // 3. Events (Next 7 days)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const upcomingEvents = await Event.find({
      userId,
      start: { $gte: now, $lte: nextWeek }
    }).sort({ start: 1 }).limit(10);

    // 4. Notes (Last 5)
    const recentNotes = await Note.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title');

    // 5. Study Stats
    const nowD = new Date();
    const weekStart = new Date(nowD);
    weekStart.setDate(weekStart.getDate() - 7);
    const studySessions = await StudySession.find({ userId, completed: true, startedAt: { $gte: weekStart } });
    
    let totalStudyMins = 0;
    const subjectCounts = {};
    studySessions.forEach(s => {
      const mins = Math.round(s.duration / 60);
      totalStudyMins += mins;
      if (!subjectCounts[s.subject]) subjectCounts[s.subject] = 0;
      subjectCounts[s.subject] += mins;
    });
    const bestSubject = Object.keys(subjectCounts).sort((a,b) => subjectCounts[b] - subjectCounts[a])[0] || 'None';

    // 6. Study Goals
    const activeStudyGoals = await StudyGoal.find({ userId, active: true }).limit(10);
    let goalProgressStr = '';
    activeStudyGoals.forEach(g => {
      const subjectSessions = studySessions.filter(s => s.subject === g.subject);
      const actualMins = Math.round(subjectSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
      const progPct = Math.min(Math.round((actualMins / g.targetMinutesPerWeek) * 100), 100);
      goalProgressStr += `  - ${g.subject}: ${progPct}% (${actualMins}/${g.targetMinutesPerWeek} min)\n`;
    });

    // 7. Flashcards
    const dueCards = await Flashcard.countDocuments({ userId, nextReview: { $lte: new Date() } });

    // Build the string
    let contextStr = `USER CONTEXT (as of ${new Date().toLocaleDateString()}):\n`;
    contextStr += `Tasks: ${tasksTotal} total, ${done} done, ${inProgress} in-progress, ${todo} todo\n`;
    
    if (upcomingTasks.length > 0) {
      contextStr += `Top upcoming tasks:\n`;
      upcomingTasks.forEach(t => {
        const dateStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date';
        contextStr += `  - "${t.title}" (${t.priority}, due ${dateStr})\n`;
      });
    }

    if (activeGoals.length > 0) {
      contextStr += `Active goals:\n`;
      activeGoals.forEach(g => {
        const doneMS = g.milestones ? g.milestones.filter(m => m.done).length : 0;
        const totalMS = g.milestones ? g.milestones.length : 0;
        const prog = totalMS ? Math.round((doneMS / totalMS) * 100) : 0;
        contextStr += `  - "${g.title}" — ${prog}% complete (${doneMS}/${totalMS} milestones)\n`;
      });
    }

    if (upcomingEvents.length > 0) {
      contextStr += `Upcoming events (7 days):\n`;
      upcomingEvents.forEach(e => {
        contextStr += `  - "${e.title}" — ${new Date(e.start).toLocaleString()}\n`;
      });
    }

    if (recentNotes.length > 0) {
      contextStr += `Recent notes: ${recentNotes.map(n => n.title).join(', ')}\n`;
    }

    contextStr += `Study Stats (Last 7 days): ${Math.round(totalStudyMins / 60 * 10) / 10} hours total. Most studied: ${bestSubject}\n`;

    if (activeStudyGoals.length > 0) {
      contextStr += `Study Goals Progress:\n${goalProgressStr}`;
    }
    
    contextStr += `Flashcards due for review: ${dueCards}\n`;

    return contextStr;
  } catch (err) {
    console.error('Error building context:', err);
    return 'USER CONTEXT: (Failed to load dynamic context)';
  }
};

export const chatWithAI = async (req, res) => {
  try {
    const { messages, conversationId } = req.body;
    const userId = req.user._id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid request format. "messages" array is required.' });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || typeof lastMessage.content !== 'string' || !lastMessage.content.trim()) {
      return res.status(400).json({ success: false, message: 'The last message must have non-empty text content.' });
    }

    // Check for Slash Commands
    const userMsgContent = lastMessage.content.trim();
    if (userMsgContent.startsWith('/')) {
      const parts = userMsgContent.split(' ');
      const command = parts[0].toLowerCase();
      const payload = parts.slice(1).join(' ');

      let responseText = '';
      
      if (command === '/task' && payload) {
        await Task.create({ userId, title: payload });
        responseText = `✅ Created task: "${payload}"`;
      } else if (command === '/goal' && payload) {
        await Goal.create({ userId, title: payload });
        responseText = `✅ Created goal: "${payload}"`;
      } else if (command === '/note' && payload) {
        await Note.create({ userId, title: payload, content: '' });
        responseText = `✅ Created note: "${payload}"`;
      } else if (command === '/event' && payload) {
        const start = new Date();
        const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
        await Event.create({ userId, title: payload, start, end });
        responseText = `✅ Scheduled event: "${payload}" for now.`;
      } else if (command === '/summarize') {
        responseText = `To summarize a note, please open it in the Notes tab and use the AI summarize button there.`;
      } else {
        responseText = `Unknown command or missing title. Available: /task, /goal, /note, /event.`;
      }

      return res.status(200).json({ success: true, message: responseText });
    }

    // Anything past the slash-command branch needs the AI provider.
    if (missingGroqKey(res)) return;

    // 1. Build context & construct prompt
    const userContextStr = await buildUserContext(userId);
    
    const systemPrompt = `You are AILifeOS Assistant — a precise, knowledgeable personal productivity AI built into AILifeOS, a personal operating system for tasks, goals, notes, focus, and life management.

${userContextStr}

RESPONSE RULES (follow strictly):
- Be concise and structured. No filler phrases like "Great question!" or "Certainly!".
- Use **markdown** formatting: headers (## or ###), bullet lists, numbered lists, bold, inline code, and fenced code blocks.
- Use bullet points for lists. Never use ASCII pipe-table art.
- Break complex answers into clearly labeled sections with ## headings.
- For code, always use fenced code blocks with the language identifier (e.g. \`\`\`js).
- Keep responses focused — never repeat the user's question back.
- End with a short, specific action suggestion or follow-up question when relevant.
- Ground your advice in the user's actual tasks, goals and focus data shown above.`;

    // Only send the recent turns. An unbounded history would eventually exceed
    // the model's context window and fail every request.
    const recentMessages = messages
      .slice(-20)
      .filter(m => m && typeof m.content === 'string' && m.content.trim())
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content.slice(0, 8000),
      }));

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...recentMessages
    ];

    // 2. Call AI
    const chatCompletion = await groq.chat.completions.create({
      messages: fullMessages,
      model: AI_MODEL,
      temperature: 0.65,
      max_tokens: 900,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || '';

    // 3. Save to Conversation model
    let conv = null;
    const userMsg = lastMessage; // latest user message
    const aiMsg = { role: 'assistant', content: responseContent };

    if (conversationId) {
      const existing = await Conversation.findById(conversationId);

      // Only the owner may append to a conversation. Previously a foreign id
      // was silently accepted and its _id echoed back to the caller.
      if (existing && existing.userId.toString() !== userId.toString()) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }

      if (existing) {
        existing.messages.push({ role: 'user', content: userMsg.content }, aiMsg);

        // Keep the stored transcript bounded — a Mongo document caps at 16MB.
        if (existing.messages.length > 200) {
          existing.messages = existing.messages.slice(-200);
        }

        await existing.save();
        conv = existing;
      }
    }

    if (!conv) {
      // Create new conversation
      let title = userMsg.content.substring(0, 40);
      if (userMsg.content.length > 40) title += '...';

      conv = await Conversation.create({
        userId,
        title,
        messages: [{ role: 'user', content: userMsg.content }, aiMsg]
      });
    }

    res.status(200).json({
      success: true,
      message: responseContent,
      conversationId: conv._id
    });
  } catch (error) {
    console.error('Groq AI Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process AI request.', error: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const convs = await Conversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('_id title updatedAt messages isPinned isArchived'); // Need messages for preview
      
    const formatted = convs.map(c => {
      const lastMsg = c.messages.length > 0 ? c.messages[c.messages.length - 1].content : '';
      return {
        _id: c._id,
        title: c.title,
        isPinned: c.isPinned || false,
        isArchived: c.isArchived || false,
        updatedAt: c.updatedAt,
        preview: lastMsg.substring(0, 50) + (lastMsg.length > 50 ? '...' : '')
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getConversation = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || conv.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    res.status(200).json({ success: true, data: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || conv.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    await conv.deleteOne();
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const { title, isPinned, isArchived } = req.body;
    const conv = await Conversation.findById(req.params.id);
    
    if (!conv || conv.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (title !== undefined) conv.title = title;
    if (isPinned !== undefined) conv.isPinned = isPinned;
    if (isArchived !== undefined) conv.isArchived = isArchived;

    await conv.save();
    res.status(200).json({ success: true, data: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const generateGoalRoadmap = async (req, res) => {
  try {
    if (missingGroqKey(res)) return;

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt required' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: `You are an AI planner. Output strictly valid JSON representing a 4-week roadmap based on the user's goal prompt. Format: {"title":"string", "description":"string", "weeks":[{"week":number, "focus":"string", "milestones":["string"]}]}` },
        { role: 'user', content: prompt.trim().slice(0, 2000) }
      ],
      model: AI_MODEL,
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const parsed = parseJsonResponse(completion.choices[0]?.message?.content);
    if (!parsed || !Array.isArray(parsed.weeks)) {
      return res.status(422).json({
        success: false,
        message: 'The AI returned an unexpected format. Please try again.'
      });
    }

    res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    console.error('Groq roadmap error:', err);
    res.status(502).json({ success: false, message: 'The AI service failed to generate a roadmap. Please try again.' });
  }
};

export const summarizeNote = async (req, res) => {
  try {
    if (missingGroqKey(res)) return;

    const note = await Note.findById(req.params.noteId);
    if (!note || note.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (!note.content || !note.content.trim()) {
      return res.status(400).json({ success: false, message: 'This note is empty — nothing to summarize.' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: `You are an AI summarizer. Read the following note and output valid JSON: {"keyPoints":["string"], "tldr":"string", "tip":"string"}` },
        { role: 'user', content: note.content.slice(0, 12000) }
      ],
      model: AI_MODEL,
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const parsed = parseJsonResponse(completion.choices[0]?.message?.content);
    if (!parsed || (!parsed.tldr && !Array.isArray(parsed.keyPoints))) {
      return res.status(422).json({
        success: false,
        message: 'The AI returned an unexpected format. Please try again.'
      });
    }

    res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    console.error('Groq summarize error:', err);
    res.status(502).json({ success: false, message: 'The AI service failed to summarize this note. Please try again.' });
  }
};

export const generateQuiz = async (req, res) => {
  try {
    if (missingGroqKey(res)) return;

    const note = await Note.findById(req.params.noteId);
    if (!note || note.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (!note.content || !note.content.trim()) {
      return res.status(400).json({ success: false, message: 'This note is empty — nothing to build a quiz from.' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: `You are an AI quiz generator. Read the note content and generate 3-5 multiple choice questions in valid JSON format: {"questions":[{"question":"string", "options":["str","str","str","str"], "correct":number(0-3), "explanation":"string"}]}` },
        { role: 'user', content: note.content.slice(0, 12000) }
      ],
      model: AI_MODEL,
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const parsed = parseJsonResponse(completion.choices[0]?.message?.content);

    // Keep only well-formed questions so the UI never renders a broken quiz.
    const questions = Array.isArray(parsed?.questions)
      ? parsed.questions.filter(q =>
          q && typeof q.question === 'string' && q.question.trim()
          && Array.isArray(q.options) && q.options.length >= 2
          && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length)
      : [];

    if (questions.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'The AI could not generate a valid quiz from this note. Please try again.'
      });
    }

    res.status(200).json({ success: true, data: { ...parsed, questions } });
  } catch (err) {
    console.error('Groq quiz error:', err);
    res.status(502).json({ success: false, message: 'The AI service failed to generate a quiz. Please try again.' });
  }
};

export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // pdfParse is the default export — call it as a function with the file buffer
    const result = await pdfParse(req.file.buffer);
    const text = result.text;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from this PDF. It may be a scanned image, which is not supported.',
      });
    }

    // Bound the payload sent back to the browser (and later into a note).
    const MAX_CHARS = 100000;
    const truncated = text.length > MAX_CHARS;

    res.status(200).json({
      success: true,
      text: truncated ? text.slice(0, MAX_CHARS) : text,
      truncated,
      pages: result.numpages,
    });
  } catch (err) {
    // pdf-parse 1.1.1 bundles an old pdf.js build (pinned deliberately: the 2.x
    // line pulls in @napi-rs/canvas, a native dep that breaks on Vercel). It
    // rejects some valid-but-unusual PDFs with low-level format errors, so give
    // the user an actionable message instead of blaming their file.
    const detail = err?.details || err?.message || '';
    console.error('PDF Parse error:', detail);

    const unsupportedFormat = /xref|invalid number|formaterror/i.test(String(detail));

    res.status(422).json({
      success: false,
      message: unsupportedFormat
        ? 'This PDF uses a structure our reader cannot parse. Try re-saving or exporting it as a new PDF, then upload again.'
        : 'This PDF could not be read. It may be corrupt or password-protected.',
    });
  }
};
