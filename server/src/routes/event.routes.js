import express from 'express';
import { 
  getEvents, getEventsByRange, getEvent, createEvent, updateEvent, deleteEvent, moveEvent
} from '../controllers/event.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getEvents)
  .post(createEvent);

router.route('/range')
  .get(getEventsByRange);

router.route('/:id')
  .get(getEvent)
  .put(updateEvent)
  .delete(deleteEvent);

router.route('/:id/move')
  .patch(moveEvent);

export default router;
