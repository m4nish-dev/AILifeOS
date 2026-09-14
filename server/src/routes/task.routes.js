import express from 'express';
import { getTasks, getTask, createTask, updateTask, deleteTask, scheduleTask } from '../controllers/task.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes in this file are protected
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.post('/:id/schedule', scheduleTask);

export default router;
