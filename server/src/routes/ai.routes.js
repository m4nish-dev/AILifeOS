import express from 'express';
import multer from 'multer';
import { 
  chatWithAI, getConversations, getConversation, deleteConversation, updateConversation,
  generateGoalRoadmap, summarizeNote, generateQuiz, uploadPdf
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// PDF uploads are held in memory, so they must be bounded. Reject anything
// that isn't a PDF before it is buffered.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf'
      && file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new Error('ONLY_PDF_ALLOWED'));
    }
    cb(null, true);
  },
});

// Translate multer's errors into our standard JSON response shape.
const uploadPdfMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();

    if (err.message === 'ONLY_PDF_ALLOWED') {
      return res.status(415).json({ success: false, message: 'Only PDF files are supported.' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'PDF is too large (10MB maximum).' });
    }
    return res.status(400).json({ success: false, message: 'File upload failed.' });
  });
};

router.use(protect); // All AI routes protected

router.route('/chat')
  .post(chatWithAI);

router.post('/upload-pdf', uploadPdfMiddleware, uploadPdf);

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
