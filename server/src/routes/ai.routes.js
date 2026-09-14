import express from 'express';
import multer from 'multer';
import { 
  chatWithAI, getConversations, getConversation, deleteConversation, updateConversation,
  generateGoalRoadmap, summarizeNote, generateQuiz, uploadPdf
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect); // All AI routes protected

router.route('/chat')
  .post(chatWithAI);

router.post('/upload-pdf', upload.single('file'), uploadPdf);

router.route('/conversations')
  .get(getConversations);

router.route('/conversations/:id')
  .get(getConversation)
  .put(updateConversation)
  .delete(deleteConversation);

router.post('/goal-roadmap', generateGoalRoadmap);
router.post('/summarize-note/:noteId', summarizeNote);
router.post('/quiz/:noteId', generateQuiz);

export default router;
