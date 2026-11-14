import Task from '../models/Task.model.js';
import StudySession from '../models/StudySession.model.js';
import Goal from '../models/Goal.model.js';
import {
  percentChange, streakFromDates, readTzOffset, localDayKey, recentDayKeys, localMidnightUtc, weekdayLabel,
  localWeekday, localHour,
} from '../utils/analytics.utils.js';


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
    
    const tz = readTzOffset(req);
    const allDates = [
      ...allSessions.map(s => localDayKey(s.startedAt, tz)),
      ...allTaskDone.filter(t => t.completedAt).map(t => localDayKey(t.completedAt, tz))
    ];

    const streakDays = streakFromDates(allDates, tz);

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
    // Rolling 7 days on the USER's calendar (was UTC: work done after midnight
    // local time but before UTC midnight landed on the previous day).
    const tz = readTzOffset(req);
    const dates = recentDayKeys(7, tz);
    const startDate = localMidnightUtc(dates[0], tz);
    
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
      const dayStr = weekdayLabel(dateStr);
      const dayTasks = tasks.filter(t => t.completedAt && localDayKey(t.completedAt, tz) === dateStr).length;
      const daySessions = sessions.filter(s => localDayKey(s.startedAt, tz) === dateStr);
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

// Category donut colours, from the app palette (#AB562F burnt orange,
// #1B1612 dark, #C1B0A6 taupe). Orange and dark are the only pair that stays
// distinguishable for colour-blind readers, so the donut shows the top two
// categories in those and folds everything else into a taupe "Other" slice.
// Legend labels carry the names, so identity never relies on colour alone.
const SERIES_COLORS = ['#AB562F', '#1B1612'];
const OTHER_COLOR = '#C1B0A6';
// Goal progress bars are a single series: one colour.
const PROGRESS_COLOR = '#AB562F';

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

    const label = (name) => name.charAt(0).toUpperCase() + name.slice(1);
    const pct = (mins) => Math.round((mins / totalMinutes) * 100);
    const ranked = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const data = ranked.slice(0, SERIES_COLORS.length).map(([name, mins], i) => ({
      name: label(name),
      value: pct(mins),
      color: SERIES_COLORS[i],
    }));
    const otherMins = ranked.slice(SERIES_COLORS.length).reduce((sum, [, mins]) => sum + mins, 0);
    if (otherMins > 0) data.push({ name: 'Other', value: pct(otherMins), color: OTHER_COLOR });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGoalsProgress = async (req, res) => {
  try {
    const activeGoals = await Goal.find({ userId: req.user._id, status: 'active' });
    
    const data = activeGoals.map((g) => {
      const total = g.milestones.length;
      const done = g.milestones.filter(m => m.done).length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        name: g.title,
        progress,
        target: 100,
        color: PROGRESS_COLOR
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
    const tz = readTzOffset(req);
    const dates = recentDayKeys(days, tz);
    const startDate = localMidnightUtc(dates[0], tz);

    const tasks = await Task.find({ userId, status: 'done', completedAt: { $gte: startDate } }).select('completedAt');
    const sessions = await StudySession.find({ userId, completed: true, startedAt: { $gte: startDate } }).select('startedAt');

    const activityMap = {};
    dates.forEach(d => activityMap[d] = 0);

    tasks.forEach(t => {
      if (t.completedAt) {
        const dStr = localDayKey(t.completedAt, tz);
        if (activityMap[dStr] !== undefined) activityMap[dStr]++;
      }
    });

    sessions.forEach(s => {
      const dStr = localDayKey(s.startedAt, tz);
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
    const tz = readTzOffset(req);
    tasks.forEach(t => dayCounts[localWeekday(t.completedAt, tz)]++);
    sessions.forEach(s => dayCounts[localWeekday(s.startedAt, tz)]++);
    
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
        const h = localHour(tz, s.startedAt);
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
