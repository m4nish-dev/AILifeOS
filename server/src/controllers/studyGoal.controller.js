import StudyGoal from '../models/StudyGoal.model.js';
import StudySession from '../models/StudySession.model.js';

export const getGoals = async (req, res) => {
  try {
    const goals = await StudyGoal.find({ userId: req.user._id });
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGoal = async (req, res) => {
  try {
    const goal = await StudyGoal.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const goal = await StudyGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    await StudyGoal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const activeGoals = await StudyGoal.find({ userId, active: true });
    
    // Get start of week
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const sessionsThisWeek = await StudySession.find({
      userId,
      completed: true,
      startedAt: { $gte: startOfWeek }
    });

    // Compute progress for each goal
    const data = activeGoals.map(goal => {
      const subjectSessions = sessionsThisWeek.filter(s => s.subject === goal.subject);
      const actualMinutes = Math.round(subjectSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
      const progressPct = goal.targetMinutesPerWeek > 0 
        ? Math.min(Math.round((actualMinutes / goal.targetMinutesPerWeek) * 100), 100)
        : 0;
      
      return {
        id: goal._id,
        subject: goal.subject,
        target: goal.targetMinutesPerWeek,
        actual: actualMinutes,
        progress: progressPct
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
