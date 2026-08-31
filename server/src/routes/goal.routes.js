import express from 'express';
import { 
  getGoals, getGoal, createGoal, updateGoal, deleteGoal, 
  toggleMilestone, addMilestone, removeMilestone 
} from '../controllers/goal.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGoals)
  .post(createGoal);

router.route('/:id')
  .get(getGoal)
  .put(updateGoal)
  .delete(deleteGoal);

router.route('/:id/milestones')
  .post(addMilestone);

router.route('/:id/milestones/:milestoneId')
  .patch(toggleMilestone)
  .delete(removeMilestone);

export default router;
