import Goal from '../models/Goal.model.js';
import Task from '../models/Task.model.js';
import Notification from '../models/Notification.model.js';

const GOAL_WRITABLE_FIELDS = [
  'title', 'description', 'status', 'dueDate', 'color', 'category', 'icon', 'milestones'
];

// Only these milestone fields may come from the client; `done`/`completedAt`
// are managed through the toggle endpoint.
const MILESTONE_WRITABLE_FIELDS = ['id', 'title', 'week'];

const pickWritable = (body, allowed) =>
  allowed.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});

// @desc   Get all goals
// @route  GET /api/goals
// @access Protected
export const getGoals = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const goals = await Goal.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Goals fetched successfully.',
      data: { goals, count: goals.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single goal
// @route  GET /api/goals/:id
// @access Protected
export const getGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, message: 'Goal fetched', data: { goal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create goal
// @route  POST /api/goals
// @access Protected
export const createGoal = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const goal = await Goal.create({
      ...pickWritable(req.body, GOAL_WRITABLE_FIELDS),
      userId: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Goal created', data: { goal } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Update goal
// @route  PUT /api/goals/:id
// @access Protected
export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    GOAL_WRITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) goal[field] = req.body[field];
    });

    // Auto complete check based on milestones
    if (goal.milestones && goal.milestones.length > 0) {
      const allDone = goal.milestones.every(m => m.done);
      if (allDone && goal.status !== 'completed') {
        goal.status = 'completed';
      }
    }

    await goal.save();
    
    // Fetch it again to get the computed progress virtual field in the returned object
    // or just return the saved doc which might not include virtuals unless transformed
    const savedGoal = await Goal.findById(goal._id);

    res.status(200).json({ success: true, message: 'Goal updated', data: { goal: savedGoal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete goal
// @route  DELETE /api/goals/:id
// @access Protected
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await goal.deleteOne();
    res.status(200).json({ success: true, message: 'Goal deleted successfully.', data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all tasks linked to a goal
// @route  GET /api/goals/:id/tasks
// @access Protected
export const getGoalTasks = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.userId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

    const tasks = await Task.find({ goalId: goal._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Toggle milestone
// @route  PATCH /api/goals/:id/milestones/:milestoneId
// @access Protected
export const toggleMilestone = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const milestone = goal.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    const prevStatus = goal.status;
    milestone.done = !milestone.done;
    milestone.completedAt = milestone.done ? new Date() : undefined;

    // Auto complete check
    const allDone = goal.milestones.every(m => m.done);
    if (allDone && prevStatus !== 'completed') {
      goal.status = 'completed';
      // Trigger Notification
      await Notification.create({
        userId: req.user._id,
        type: 'goal',
        title: 'Goal Completed! 🏆',
        message: `You've achieved your goal: "${goal.title}"`,
        link: '/goals'
      });
    } else if (!allDone && prevStatus === 'completed') {
      goal.status = 'active';
    }

    await goal.save();
    const savedGoal = await Goal.findById(goal._id);

    res.status(200).json({ success: true, message: 'Milestone toggled', data: { goal: savedGoal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Add milestone
// @route  POST /api/goals/:id/milestones
// @access Protected
export const addMilestone = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const milestone = pickWritable(req.body, MILESTONE_WRITABLE_FIELDS);
    if (!milestone.title || !String(milestone.title).trim()) {
      return res.status(400).json({ success: false, message: 'Milestone title is required' });
    }

    goal.milestones.push(milestone);
    await goal.save();
    const savedGoal = await Goal.findById(goal._id);

    res.status(201).json({ success: true, message: 'Milestone added', data: { goal: savedGoal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Remove milestone
// @route  DELETE /api/goals/:id/milestones/:milestoneId
// @access Protected
export const removeMilestone = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    goal.milestones.pull(req.params.milestoneId);
    await goal.save();
    const savedGoal = await Goal.findById(goal._id);

    res.status(200).json({ success: true, message: 'Milestone removed', data: { goal: savedGoal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
