import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getOverviewStats,
  getWeeklyProductivity,
  getCategoryBreakdown,
  getGoalsProgress,
  getActivityHeatmap,
  getAIInsights
} from '../controllers/analytics.controller.js';

const router = express.Router();

router.use(protect);

router.get('/overview', getOverviewStats);
router.get('/weekly-productivity', getWeeklyProductivity);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/goals-progress', getGoalsProgress);
router.get('/heatmap', getActivityHeatmap);
router.get('/insights', getAIInsights);

export default router;
