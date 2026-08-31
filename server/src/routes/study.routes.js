import express from 'express';
import { 
  startSession, endSession, getSessions, getSession, deleteSession, getStats
} from '../controllers/study.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/sessions', startSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.put('/sessions/:id/end', endSession);
router.delete('/sessions/:id', deleteSession);
router.get('/stats', getStats);

export default router;
