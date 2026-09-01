import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import Conversation from '../models/Conversation.model.js';
import Task from '../models/Task.model.js';
import Goal from '../models/Goal.model.js';
import Event from '../models/Event.model.js';
import Note from '../models/Note.model.js';
import StudySession from '../models/StudySession.model.js';
import StudyGoal from '../models/StudyGoal.model.js';
import Flashcard from '../models/Flashcard.model.js';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Helper: Build context string for the AI based on live user data
const buildUserContext = async (userId) => {
  try {
    // 1. Tasks
    const tasks = await Task.find({ userId });
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    
    const upcomingTasks = tasks
      .filter(t => t.status !== 'done' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    // 2. Goals
    const activeGoals = await Goal.find({ userId, status: 'active' });

    // 3. Events (Next 7 days)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const upcomingEvents = await Event.find({
      userId,
      start: { $gte: now, $lte: nextWeek }
    }).sort({ start: 1 });

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
    const activeStudyGoals = await StudyGoal.find({ userId, active: true });
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
    contextStr += `Tasks: ${tasks.length} total, ${done} done, ${inProgress} in-progress, ${todo} todo\n`;
    
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

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Invalid request format. "messages" array is required.' });
    }

    // Check for Slash Commands
    const userMsgContent = messages[messages.length - 1].content.trim();
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
- Always tailor advice to a developer/student building AILifeOS, focused on frontend development, DSA, and career goals.`;

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // 2. Call AI
    const chatCompletion = await groq.chat.completions.create({
      messages: fullMessages,
      model: "openai/gpt-oss-20b",
      temperature: 0.65,
      max_tokens: 900,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || '';

    // 3. Save to Conversation model
    let conv;
    const userMsg = messages[messages.length - 1]; // latest user message
    const aiMsg = { role: 'assistant', content: responseContent };

    if (conversationId) {
      conv = await Conversation.findById(conversationId);
      if (conv && conv.userId.toString() === userId.toString()) {
        conv.messages.push({ role: 'user', content: userMsg.content }, aiMsg);
        await conv.save();
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
      .select('_id title updatedAt messages'); // Need messages for preview
      
    const formatted = convs.map(c => {
      const lastMsg = c.messages.length > 0 ? c.messages[c.messages.length - 1].content : '';
      return {
        _id: c._id,
        title: c.title,
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

export const generateGoalRoadmap = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt required' });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: `You are an AI planner. Output strictly valid JSON representing a 4-week roadmap based on the user's goal prompt. Format: {"title":"string", "description":"string", "weeks":[{"week":number, "focus":"string", "milestones":["string"]}]}` },
        { role: 'user', content: prompt }
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const summarizeNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: `You are an AI summarizer. Read the following note and output valid JSON: {"keyPoints":["string"], "tldr":"string", "tip":"string"}` },
        { role: 'user', content: note.content }
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const generateQuiz = async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note || note.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: `You are an AI quiz generator. Read the note content and generate 3-5 multiple choice questions in valid JSON format: {"questions":[{"question":"string", "options":["str","str","str","str"], "correct":number(0-3), "explanation":"string"}]}` },
        { role: 'user', content: note.content }
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
