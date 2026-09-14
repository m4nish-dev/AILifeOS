import express from 'express';
import { 
  startSession, endSession, getSessions, getSession, deleteSession, getStats, getSubjectStats, getFocusPattern
} from '../controllers/study.controller.js';
import * as goalController from '../controllers/studyGoal.controller.js';
import * as flashcardController from '../controllers/flashcard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/sessions', startSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.put('/sessions/:id/end', endSession);
router.delete('/sessions/:id', deleteSession);
router.get('/stats', getStats);
router.get('/stats/subjects', getSubjectStats);
router.get('/stats/focus-pattern', getFocusPattern);

// Goals
router.get('/goals', goalController.getGoals);
router.post('/goals', goalController.createGoal);
router.put('/goals/:id', goalController.updateGoal);
router.delete('/goals/:id', goalController.deleteGoal);
router.get('/goals/progress', goalController.getProgress);

// Flashcards
router.get('/flashcards/decks', flashcardController.getDecks);
router.get('/flashcards/deck/:deckName', flashcardController.getFlashcardsByDeck);
router.get('/flashcards/due', flashcardController.getDueFlashcards);
router.post('/flashcards', flashcardController.createFlashcard);
router.put('/flashcards/:id', flashcardController.updateFlashcard);
router.delete('/flashcards/:id', flashcardController.deleteFlashcard);
router.post('/flashcards/:id/review', flashcardController.reviewFlashcard);
router.post('/flashcards/generate/:noteId', flashcardController.generateFromNote);

export default router;
