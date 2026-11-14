import Flashcard from '../models/Flashcard.model.js';
import Note from '../models/Note.model.js';
import Groq from 'groq-sdk';
import { AI_MODEL } from '../config/ai.js';

// Lazy init — never construct the Groq client at import time, so the server can
// boot even when GROQ_API_KEY is missing. Same pattern as ai.controller.js.
const getGroqClient = () => new Groq({
  apiKey: process.env.GROQ_API_KEY || 'missing_key',
});

export const getDecks = async (req, res) => {
  try {
    const cards = await Flashcard.find({ userId: req.user._id });
    const now = new Date();
    
    const deckMap = {};
    cards.forEach(c => {
      if (!deckMap[c.deckName]) {
        deckMap[c.deckName] = { deckName: c.deckName, total: 0, due: 0 };
      }
      deckMap[c.deckName].total++;
      if (c.nextReview <= now) deckMap[c.deckName].due++;
    });

    res.status(200).json({ success: true, data: Object.values(deckMap) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFlashcardsByDeck = async (req, res) => {
  try {
    const cards = await Flashcard.find({ userId: req.user._id, deckName: req.params.deckName });
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Only content fields are client-writable. userId and the spaced-repetition
// state (nextReview, reviewCount, correctCount, lastReviewed) are owned by the
// server; previously the whole body was spread in, so an update could even
// move a card to another user's account by sending a different userId.
const FLASHCARD_WRITABLE_FIELDS = ['deckName', 'front', 'back', 'noteId', 'difficulty'];
const pickFlashcardFields = (body = {}) =>
  FLASHCARD_WRITABLE_FIELDS.reduce((acc, f) => {
    if (body[f] !== undefined) acc[f] = body[f];
    return acc;
  }, {});

// Bad input is the client's fault (400), not a server failure (500).
const isClientError = (error) => error?.name === 'ValidationError' || error?.name === 'CastError';

export const createFlashcard = async (req, res) => {
  try {
    const card = await Flashcard.create({ ...pickFlashcardFields(req.body), userId: req.user._id });
    res.status(201).json({ success: true, data: card });
  } catch (error) {
    res.status(isClientError(error) ? 400 : 500).json({ success: false, message: error.message });
  }
};

export const updateFlashcard = async (req, res) => {
  try {
    const card = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      pickFlashcardFields(req.body),
      { new: true, runValidators: true }
    );
    if (!card) return res.status(404).json({ success: false, message: 'Flashcard not found.' });
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    res.status(isClientError(error) ? 400 : 500).json({ success: false, message: error.message });
  }
};

export const deleteFlashcard = async (req, res) => {
  try {
    const card = await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!card) return res.status(404).json({ success: false, message: 'Flashcard not found.' });
    res.status(200).json({ success: true, message: 'Flashcard deleted' });
  } catch (error) {
    res.status(isClientError(error) ? 400 : 500).json({ success: false, message: error.message });
  }
};

export const reviewFlashcard = async (req, res) => {
  try {
    const { correct } = req.body;
    const card = await Flashcard.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

    const now = new Date();
    card.lastReviewed = now;
    card.reviewCount += 1;

    let nextReviewDate = new Date();
    
    if (correct) {
      card.correctCount += 1;
      // Leitner-style doubling interval (1,2,4,8…) capped at 60 days, so cards
      // keep coming back instead of being pushed out indefinitely.
      const interval = Math.min(2 ** (card.correctCount - 1), 60);
      nextReviewDate.setDate(now.getDate() + interval);
    } else {
      // A wrong answer resets progress and schedules it for tomorrow.
      card.correctCount = 0;
      nextReviewDate.setDate(now.getDate() + 1);
    }
    
    card.nextReview = nextReviewDate;
    await card.save();

    res.status(200).json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDueFlashcards = async (req, res) => {
  try {
    const now = new Date();
    const cards = await Flashcard.find({ userId: req.user._id, nextReview: { $lte: now } });
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateFromNote = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI features are not configured on this server. The GROQ_API_KEY environment variable is missing.',
      });
    }

    // The route is POST /flashcards/generate/:noteId, but older clients sent
    // the id in the body — accept either so both work.
    const noteId = req.params.noteId || req.body.noteId;
    const { deckName } = req.body;

    if (!noteId) {
      return res.status(400).json({ success: false, message: 'A noteId is required.' });
    }

    const note = await Note.findOne({ _id: noteId, userId: req.user._id });
    
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    
    if (!note.content || !note.content.trim()) {
      return res.status(400).json({ success: false, message: 'This note is empty — nothing to generate from.' });
    }

    // Cap the text sent to the model so a huge note can't blow the context
    // window (and the request budget).
    const sourceText = note.content.slice(0, 12000);

    const prompt = `Generate 5-10 study flashcards from the following text.
Return strictly a JSON array of objects, where each object has a 'front' (the question) and 'back' (the answer) string property.
Do not include markdown blocks like \`\`\`json, just the raw JSON array.
Text: ${sourceText}`;

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: AI_MODEL,
      temperature: 0.2,
    });

    let rawOutput = completion.choices[0]?.message?.content || '[]';
    // Clean up potential markdown formatting from LLM
    rawOutput = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let generatedCards = [];
    try {
      generatedCards = JSON.parse(rawOutput);
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Failed to parse AI response as JSON.' });
    }

    if (!Array.isArray(generatedCards)) {
      return res.status(500).json({ success: false, message: 'AI did not return an array.' });
    }

    // The model can return malformed entries — keep only usable cards so a
    // single bad item doesn't fail the whole insert.
    const cardsToInsert = generatedCards
      .filter(c => c && typeof c.front === 'string' && typeof c.back === 'string'
        && c.front.trim() && c.back.trim())
      .slice(0, 20)
      .map(c => ({
        userId: req.user._id,
        deckName: (deckName || note.title || 'Generated').trim(),
        front: c.front.trim(),
        back: c.back.trim(),
        noteId: note._id
      }));

    if (cardsToInsert.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'The AI did not return any usable flashcards. Please try again.'
      });
    }

    const inserted = await Flashcard.insertMany(cardsToInsert);

    res.status(201).json({ success: true, data: inserted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
