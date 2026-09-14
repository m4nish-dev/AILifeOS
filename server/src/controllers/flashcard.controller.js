import Flashcard from '../models/Flashcard.model.js';
import Note from '../models/Note.model.js';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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

export const createFlashcard = async (req, res) => {
  try {
    const card = await Flashcard.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFlashcard = async (req, res) => {
  try {
    const card = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFlashcard = async (req, res) => {
  try {
    await Flashcard.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true, message: 'Flashcard deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      // Spaced repetition: push out by correctCount * 2 days
      nextReviewDate.setDate(now.getDate() + (card.correctCount * 2));
    } else {
      // If wrong, review again tomorrow
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
    const { noteId, deckName } = req.body;
    const note = await Note.findOne({ _id: noteId, userId: req.user._id });
    
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    
    const prompt = `Generate 5-10 study flashcards from the following text. 
Return strictly a JSON array of objects, where each object has a 'front' (the question) and 'back' (the answer) string property. 
Do not include markdown blocks like \`\`\`json, just the raw JSON array.
Text: ${note.content}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
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

    const cardsToInsert = generatedCards.map(c => ({
      userId: req.user._id,
      deckName: deckName || note.title,
      front: c.front,
      back: c.back,
      noteId: note._id
    }));

    const inserted = await Flashcard.insertMany(cardsToInsert);

    res.status(201).json({ success: true, data: inserted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
