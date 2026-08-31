import express from 'express';
import { 
  chatWithAI, getConversations, getConversation, deleteConversation,
  generateGoalRoadmap, summarizeNote, generateQuiz 
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // All AI routes protected

router.route('/chat')
  .post(chatWithAI);

router.route('/conversations')
  .get(getConversations);

router.route('/conversations/:id')
  .get(getConversation)
  .delete(deleteConversation);

router.post('/goal-roadmap', generateGoalRoadmap);
router.post('/summarize-note/:noteId', summarizeNote);
router.post('/quiz/:noteId', generateQuiz);

export default router;
