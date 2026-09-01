import Task from '../models/Task.model.js';
import StudySession from '../models/StudySession.model.js';
import Goal from '../models/Goal.model.js';
import { getStartOfDay, percentChange, streakFromDates } from '../utils/analytics.utils.js';

// Helper to get dates
const getDates = (daysBack) => {
  const dates = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

export const getOverviewStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    const last7DaysStart = new Date(now);
    last7DaysStart.setDate(last7DaysStart.getDate() - 7);
    
    const prev7DaysStart = new Date(last7DaysStart);
    prev7DaysStart.setDate(prev7DaysStart.getDate() - 7);

    // Tasks
    const completedTasksLast7 = await Task.countDocuments({
      userId,
      status: 'done',
      completedAt: { $gte: last7DaysStart, $lt: now }
    });
    
    const completedTasksPrev7 = await Task.countDocuments({
      userId,
      status: 'done',
      completedAt: { $gte: prev7DaysStart, $lt: last7DaysStart }
    });

    // Focus Hours
    const sessionsLast7 = await StudySession.find({
      userId,
      completed: true,
      startedAt: { $gte: last7DaysStart, $lt: now }
    });
    
    const sessionsPrev7 = await StudySession.find({
      userId,
      completed: true,
      startedAt: { $gte: prev7DaysStart, $lt: last7DaysStart }
    });

    const focusHoursLast7 = sessionsLast7.reduce((acc, s) => acc + s.duration, 0) / 3600;
    const focusHoursPrev7 = sessionsPrev7.reduce((acc, s) => acc + s.duration, 0) / 3600;

    // Goals On Track
    const activeGoals = await Goal.find({ userId, status: 'active' });
    let goalsOnTrack = 0;
    
    activeGoals.forEach(g => {
      // Simple logic: if progress > 0, we count it as "on track" for now, 
      // or we can calculate expected progress based on due date.
      // We will count it if progress > 0
      const done = g.milestones.filter(m => m.done).length;
      if (done > 0) goalsOnTrack++;
    });

    // Streak Days
    const allSessions = await StudySession.find({ userId, completed: true }).select('startedAt');
    const allTaskDone = await Task.find({ userId, status: 'done' }).select('completedAt');
    
    const allDates = [
      ...allSessions.map(s => s.startedAt.toISOString().slice(0, 10)),
      ...allTaskDone.filter(t => t.completedAt).map(t => t.completedAt.toISOString().slice(0, 10))
    ];
    
    const streakDays = streakFromDates(allDates);

    res.status(200).json({
      success: true,
      data: {
        tasksCompleted: completedTasksLast7,
        tasksCompletedDelta: percentChange(completedTasksLast7, completedTasksPrev7),
        focusHours: Math.round(focusHoursLast7 * 10) / 10,
        focusHoursDelta: percentChange(focusHoursLast7, focusHoursPrev7),
        goalsOnTrack,
        streakDays
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWeeklyProductivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const dates = getDates(7);
    
    const startDate = getStartOfDay(new Date(dates[0]));
    
    const tasks = await Task.find({
      userId,
      status: 'done',
      completedAt: { $gte: startDate }
    });
    
    const sessions = await StudySession.find({
      userId,
      completed: true,
      startedAt: { $gte: startDate }
    });

    const data = dates.map(dateStr => {
      const dayDate = new Date(dateStr);
      const dayStr = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayTasks = tasks.filter(t => t.completedAt && t.completedAt.toISOString().slice(0, 10) === dateStr).length;
      const daySessions = sessions.filter(s => s.startedAt.toISOString().slice(0, 10) === dateStr);
      const focusHrs = daySessions.reduce((acc, s) => acc + s.duration, 0) / 3600;
      
      return {
        day: dayStr,
        tasks: dayTasks,
        focus: Math.round(focusHrs * 10) / 10
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const colors = ['#F5A524', '#0E8C5A', '#006FEE', '#F31260', '#7A4E2D', '#9353D3'];

export const getCategoryBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Consider last 30 days for category breakdown to have enough data
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const tasks = await Task.find({ userId, status: 'done', completedAt: { $gte: last30Days } });
    const sessions = await StudySession.find({ userId, completed: true, startedAt: { $gte: last30Days } });
    
    const catMap = {};
    let totalMinutes = 0;

    tasks.forEach(t => {
      const cat = t.category || 'personal';
      const mins = t.duration || 30; // Default 30 min per task if not set
      catMap[cat] = (catMap[cat] || 0) + mins;
      totalMinutes += mins;
    });

    sessions.forEach(s => {
      const cat = s.subject || 'Focus';
      const mins = Math.round(s.duration / 60);
      catMap[cat] = (catMap[cat] || 0) + mins;
      totalMinutes += mins;
    });

    if (totalMinutes === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const data = Object.keys(catMap).map((name, i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round((catMap[name] / totalMinutes) * 100),
      color: colors[i % colors.length]
    })).sort((a,b) => b.value - a.value); // Sort by highest

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGoalsProgress = async (req, res) => {
  try {
    const activeGoals = await Goal.find({ userId: req.user._id, status: 'active' });
    
    const data = activeGoals.map((g, i) => {
      const total = g.milestones.length;
      const done = g.milestones.filter(m => m.done).length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        name: g.title,
        progress,
        target: 100,
        color: colors[i % colors.length]
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActivityHeatmap = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 84;
    const userId = req.user._id;
    const dates = getDates(days);
    const startDate = new Date(dates[0]);

    const tasks = await Task.find({ userId, status: 'done', completedAt: { $gte: startDate } }).select('completedAt');
    const sessions = await StudySession.find({ userId, completed: true, startedAt: { $gte: startDate } }).select('startedAt');

    const activityMap = {};
    dates.forEach(d => activityMap[d] = 0);

    tasks.forEach(t => {
      if (t.completedAt) {
        const dStr = t.completedAt.toISOString().slice(0,10);
        if (activityMap[dStr] !== undefined) activityMap[dStr]++;
      }
    });

    sessions.forEach(s => {
      const dStr = s.startedAt.toISOString().slice(0,10);
      if (activityMap[dStr] !== undefined) activityMap[dStr]++;
    });

    // Max count to scale
    let maxCount = 0;
    Object.values(activityMap).forEach(v => { if (v > maxCount) maxCount = v; });

    const data = dates.map(date => {
      let count = activityMap[date];
      // Scale count to 0-4
      let level = 0;
      if (count > 0) {
        if (maxCount <= 4) level = count;
        else level = Math.ceil((count / maxCount) * 4);
      }
      return { date, count: level };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAIInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get last 30 days data
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    
    const tasks = await Task.find({ userId, status: 'done', completedAt: { $gte: last30 } });
    const sessions = await StudySession.find({ userId, completed: true, startedAt: { $gte: last30 } });
    
    const insights = [];

    // Most productive day of week
    const dayCounts = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 }; // Sun - Sat
    tasks.forEach(t => dayCounts[t.completedAt.getDay()]++);
    sessions.forEach(s => dayCounts[s.startedAt.getDay()]++);
    
    const totalActivity = tasks.length + sessions.length;

    if (totalActivity > 0) {
      let maxDay = 0;
      let minDay = 0;
      let maxCount = -1;
      let minCount = 99999;
      
      Object.keys(dayCounts).forEach(dayStr => {
        const count = dayCounts[dayStr];
        const day = parseInt(dayStr);
        if (count > maxCount) { maxCount = count; maxDay = day; }
        if (count < minCount) { minCount = count; minDay = day; }
      });
      
      const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
      
      insights.push({
        icon: '🚀',
        title: 'Most Productive Day',
        text: `You get the most done on ${dayNames[maxDay]}. Consider scheduling your hardest work then.`,
        color: 'green'
      });
      
      // Best focus window (most common hour)
      const hourCounts = {};
      sessions.forEach(s => {
        const h = s.startedAt.getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      });
      
      let maxHour = -1;
      let maxHourCount = 0;
      Object.keys(hourCounts).forEach(hStr => {
        if (hourCounts[hStr] > maxHourCount) {
          maxHourCount = hourCounts[hStr];
          maxHour = parseInt(hStr);
        }
      });
      
      if (maxHour !== -1) {
        const timeStr = maxHour < 12 ? `${maxHour} AM` : (maxHour === 12 ? '12 PM' : `${maxHour - 12} PM`);
        insights.push({
          icon: '⏳',
          title: 'Prime Focus Window',
          text: `You log the most deep work sessions around ${timeStr}.`,
          color: 'blue'
        });
      }
      
      if (minDay !== maxDay) {
        insights.push({
          icon: '⚠️',
          title: 'Slump Warning',
          text: `Your productivity dips on ${dayNames[minDay]}. Try setting smaller, easier tasks for this day.`,
          color: 'coffee'
        });
      }
    }
    
    // Best performing goal
    const activeGoals = await Goal.find({ userId, status: 'active' });
    if (activeGoals.length > 0) {
      let bestGoal = null;
      let bestPct = -1;
      activeGoals.forEach(g => {
        const done = g.milestones.filter(m => m.done).length;
        const total = g.milestones.length;
        const pct = total ? (done/total)*100 : 0;
        if (pct > bestPct) {
          bestPct = pct;
          bestGoal = g;
        }
      });
      
      if (bestGoal && bestPct > 0) {
        insights.push({
          icon: '🎯',
          title: 'Goal Momentum',
          text: `You're making great progress on "${bestGoal.title}" (${Math.round(bestPct)}% complete). Keep it up!`,
          color: 'green'
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        icon: '🌱',
        title: 'Ready to Grow',
        text: 'Not enough data yet. Keep completing tasks and study sessions to unlock smart insights.',
        color: 'blue'
      });
    }

    res.status(200).json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
