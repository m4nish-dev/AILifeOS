import Task from '../models/Task.model.js';
import Goal from '../models/Goal.model.js';
import Note from '../models/Note.model.js';
import Event from '../models/Event.model.js';
import StudySession from '../models/StudySession.model.js';
import User from '../models/User.model.js';
import { streakFromDates } from '../utils/analytics.utils.js';

// Helper: Productivity Score
const computeProductivityScore = async (userId, todayStart) => {
  const tasksDoneToday = await Task.countDocuments({
    userId,
    status: 'done',
    completedAt: { $gte: todayStart }
  });

  const sessionsToday = await StudySession.find({
    userId,
    completed: true,
    startedAt: { $gte: todayStart }
  });
  
  const studyMinsToday = sessionsToday.reduce((acc, s) => acc + s.duration, 0) / 60;
  
  // Basic scoring:
  // 10 pts per task (max 50)
  // 1 pt per 5 study mins (max 30)
  // 5 pts per active goal with progress (max 20) -> Simplified to just giving 20 if they have goals for performance.
  // We'll actually check active goals
  const activeGoals = await Goal.find({ userId, status: 'active' });
  const goalsWithProgress = activeGoals.filter(g => g.milestones.some(m => m.done)).length;

  let score = 0;
  score += Math.min(tasksDoneToday * 10, 50);
  score += Math.min(Math.floor(studyMinsToday / 5), 30);
  score += Math.min(goalsWithProgress * 5, 20);

  return Math.min(score, 100);
};

// Helper: AI Insight
const generateAIInsight = (tasksOverdue, studyMinsToday, streak) => {
  if (tasksOverdue > 3) {
    return `You have ${tasksOverdue} overdue tasks. Try to clear them out first today.`;
  }
  if (studyMinsToday === 0 && new Date().getHours() >= 17) {
    return "You haven't logged any focus sessions today. Even 15 minutes helps build momentum!";
  }
  if (streak >= 7) {
    return `🔥 ${streak}-day streak! You are incredibly consistent. Keep it going!`;
  }
  if (streak >= 3) {
    return `Great job maintaining a ${streak}-day streak. What's the main focus for today?`;
  }
  return "It's a great day to make progress. Pick one high-priority task and crush it.";
};

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // 1. User info & Greeting
    const hour = now.getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';

    // 2. Tasks
    const tasksDoneToday = await Task.countDocuments({ userId, status: 'done', completedAt: { $gte: todayStart } });
    const tasksPendingToday = await Task.countDocuments({ userId, status: { $ne: 'done' } }); // Total pending
    const tasksTotal = tasksDoneToday + tasksPendingToday;

    const overdueCount = await Task.countDocuments({ userId, status: { $ne: 'done' }, dueDate: { $lt: todayStart } });

    const todayFocus = await Task.find({ userId, status: { $ne: 'done' } })
      .sort({ priority: -1, dueDate: 1 })
      .limit(5);

    // 3. Goals
    const activeGoalsCount = await Goal.countDocuments({ userId, status: 'active' });
    const activeGoalsRaw = await Goal.find({ userId, status: 'active' }).limit(3);
    const activeGoalsList = activeGoalsRaw.map(g => {
      const total = g.milestones.length;
      const done = g.milestones.filter(m => m.done).length;
      return {
        _id: g._id,
        title: g.title,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
        color: g.color
      };
    }).sort((a,b) => b.progress - a.progress); // Sort highest progress first

    // 4. Notes
    const notesCount = await Note.countDocuments({ userId });
    const recentNotes = await Note.find({ userId }).sort({ updatedAt: -1 }).limit(3).select('title updatedAt tags');

    // 5. Events
    const upcomingEvents = await Event.find({ userId, start: { $gte: now } })
      .sort({ start: 1 })
      .limit(4);
    
    const eventsToday = await Event.countDocuments({ userId, start: { $gte: todayStart, $lt: new Date(todayStart.getTime() + 86400000) } });

    // 6. Streak & Study
    const allSessions = await StudySession.find({ userId, completed: true }).select('startedAt duration');
    const allTaskDone = await Task.find({ userId, status: 'done' }).select('completedAt');
    
    const allDates = [
      ...allSessions.map(s => s.startedAt.toISOString().slice(0, 10)),
      ...allTaskDone.filter(t => t.completedAt).map(t => t.completedAt.toISOString().slice(0, 10))
    ];
    
    const streakDays = streakFromDates(allDates);
    
    const studyMinsToday = allSessions
      .filter(s => s.startedAt >= todayStart)
      .reduce((acc, s) => acc + s.duration, 0) / 60;

    // 7. Productivity Score & AI Insight
    const productivityScore = await computeProductivityScore(userId, todayStart);
    const aiInsight = generateAIInsight(overdueCount, studyMinsToday, streakDays);

    res.status(200).json({
      success: true,
      data: {
        user: { name: req.user.name, greeting },
        stats: {
          tasksDone: tasksDoneToday,
          tasksTotal,
          activeGoals: activeGoalsCount,
          notesCount,
          eventsToday
        },
        todayFocus,
        upcomingEvents,
        activeGoalsList,
        recentNotes,
        streakDays,
        productivityScore,
        aiInsight
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
