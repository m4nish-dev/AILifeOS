import express from 'express';
import { 
  getNotes, getNote, createNote, updateNote, deleteNote, 
  togglePin, addTag, removeTag 
} from '../controllers/note.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .get(getNote)
  .put(updateNote)
  .delete(deleteNote);

router.route('/:id/pin')
  .patch(togglePin);

router.route('/:id/tags')
  .post(addTag);

router.route('/:id/tags/:tag')
  .delete(removeTag);

export default router;
