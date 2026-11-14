import Task from '../models/Task.model.js';
import Goal from '../models/Goal.model.js';
import Note from '../models/Note.model.js';
import Event from '../models/Event.model.js';
import StudySession from '../models/StudySession.model.js';
import User from '../models/User.model.js';
import { streakFromDates, readTzOffset, localDayKey, localMidnightUtc, localHour } from '../utils/analytics.utils.js';

// Priority is stored as a string, so a Mongo sort on it is alphabetical
// (medium > low > high) and put HIGH tasks last. Rank it explicitly.
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

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
  const activeGoals = await Goal.find({ userId, status: { $ne: 'completed' } });
  const goalsWithProgress = activeGoals.filter(g => g.milestones.some(m => m.done)).length;

  let score = 0;
  score += Math.min(tasksDoneToday * 10, 50);
  score += Math.min(Math.floor(studyMinsToday / 5), 30);
  score += Math.min(goalsWithProgress * 5, 20);

  return Math.min(score, 100);
};

// Helper: AI Insight
// `hour` is the user's local hour (the evening nudge must follow their clock).
const generateAIInsight = (tasksOverdue, studyMinsToday, streak, hour) => {
  if (tasksOverdue > 3) {
    return `You have ${tasksOverdue} overdue tasks. Try to clear them out first today.`;
  }
  if (studyMinsToday === 0 && hour >= 17) {
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
    // "Today" on the user's calendar, not the server's (Vercel runs in UTC, so
    // for an IST user the day used to roll over at 05:30).
    const tz = readTzOffset(req);
    const todayStart = localMidnightUtc(localDayKey(now, tz), tz);

    // 1. User info & Greeting
    const hour = localHour(tz, now);
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';

    // 2. Tasks
    const tasksDoneToday = await Task.countDocuments({ userId, status: 'done', completedAt: { $gte: todayStart } });
    const tasksPending = await Task.countDocuments({ userId, status: { $ne: 'done' } });
    // "Today's workload" = what's still open plus what was finished today, so
    // the done/total ratio on the dashboard is meaningful.
    const tasksTotal = tasksDoneToday + tasksPending;

    const overdueCount = await Task.countDocuments({ userId, status: { $ne: 'done' }, dueDate: { $lt: todayStart } });

    const openTasks = await Task.find({ userId, status: { $ne: 'done' } })
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(100);
    const dueTime = (t) => (t.dueDate ? new Date(t.dueDate).getTime() : Infinity); // undated last
    const todayFocus = openTasks
      .sort((a, b) => ((PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1)) || (dueTime(a) - dueTime(b)))
      .slice(0, 5);

    // 3. Goals
    const activeGoalsCount = await Goal.countDocuments({ userId, status: { $ne: 'completed' } });
    const activeGoalsRaw = await Goal.find({ userId, status: { $ne: 'completed' } }).limit(3);
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
    // Enough to mark every upcoming day in the dashboard calendar (was 4, so
    // only the first four events ever got a dot).
    const upcomingEvents = await Event.find({ userId, start: { $gte: todayStart } })
      .sort({ start: 1 })
      .limit(50);
    
    const eventsToday = await Event.countDocuments({ userId, start: { $gte: todayStart, $lt: new Date(todayStart.getTime() + 86400000) } });

    // 6. Streak & Study
    const allSessions = await StudySession.find({ userId, completed: true }).select('startedAt duration');
    const allTaskDone = await Task.find({ userId, status: 'done' }).select('completedAt');
    
    const allDates = [
      ...allSessions.map(s => localDayKey(s.startedAt, tz)),
      ...allTaskDone.filter(t => t.completedAt).map(t => localDayKey(t.completedAt, tz))
    ];
    
    const streakDays = streakFromDates(allDates, tz);
    
    const studyMinsToday = allSessions
      .filter(s => s.startedAt >= todayStart)
      .reduce((acc, s) => acc + s.duration, 0) / 60;

    // 7. Productivity Score & AI Insight
    const productivityScore = await computeProductivityScore(userId, todayStart);
    const aiInsight = generateAIInsight(overdueCount, studyMinsToday, streakDays, hour);

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
