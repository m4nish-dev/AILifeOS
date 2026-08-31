import StudySession from '../models/StudySession.model.js';
import mongoose from 'mongoose';

// @desc   Start a new session
// @route  POST /api/study/sessions
// @access Protected
export const startSession = async (req, res) => {
  try {
    const session = await StudySession.create({
      ...req.body,
      userId: req.user._id,
      startedAt: new Date()
    });
    res.status(201).json({ success: true, message: 'Session started', data: { session } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   End a session
// @route  PUT /api/study/sessions/:id/end
// @access Protected
export const endSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    session.endedAt = new Date();
    session.completed = req.body.completed !== undefined ? req.body.completed : true;
    if (req.body.duration !== undefined) session.duration = req.body.duration;
    if (req.body.notes !== undefined) session.notes = req.body.notes;

    await session.save();
    res.status(200).json({ success: true, message: 'Session ended', data: { session } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all sessions
// @route  GET /api/study/sessions
// @access Protected
export const getSessions = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    
    if (req.query.from && req.query.to) {
      filter.startedAt = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
    }
    if (req.query.subject) {
      filter.subject = { $regex: req.query.subject, $options: 'i' };
    }

    const sessions = await StudySession.find(filter).sort({ startedAt: -1 });

    res.status(200).json({ success: true, data: { sessions, count: sessions.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single session
// @route  GET /api/study/sessions/:id
// @access Protected
export const getSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session || session.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.status(200).json({ success: true, data: { session } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete session
// @route  DELETE /api/study/sessions/:id
// @access Protected
export const deleteSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session || session.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    await session.deleteOne();
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get Study Stats
// @route  GET /api/study/stats
// @access Protected
export const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get all completed sessions for this user
    const sessions = await StudySession.find({ userId, completed: true, duration: { $gt: 0 } }).sort({ startedAt: 1 });

    let totalMinutesToday = 0;
    let totalMinutesThisWeek = 0;
    const subjectMap = {};
    const daysMap = {}; // Format: YYYY-MM-DD
    
    // Initialize last 7 days map
    for(let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      daysMap[d.toISOString().slice(0,10)] = 0;
    }

    const uniqueStudyDays = new Set();
    let completedCount = 0;
    const totalSessionsCount = await StudySession.countDocuments({ userId });

    sessions.forEach(s => {
      completedCount++;
      const durationMins = Math.round(s.duration / 60);
      const sDateStr = s.startedAt.toISOString().slice(0, 10);
      uniqueStudyDays.add(sDateStr);

      if (s.startedAt >= todayStart) {
        totalMinutesToday += durationMins;
      }
      
      if (s.startedAt >= weekStart) {
        totalMinutesThisWeek += durationMins;
        if (daysMap[sDateStr] !== undefined) {
          daysMap[sDateStr] += durationMins;
        }
        
        if (!subjectMap[s.subject]) subjectMap[s.subject] = 0;
        subjectMap[s.subject] += durationMins;
      }
    });

    const completionRate = totalSessionsCount > 0 ? Math.round((completedCount / totalSessionsCount) * 100) : 0;
    
    const byDayLast7 = Object.keys(daysMap).map(date => ({ date, minutes: daysMap[date] }));

    // Calculate Streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const sortedDays = Array.from(uniqueStudyDays).sort().reverse();
    let expectedDate = new Date(); // Start checking from today
    let checkedToday = false;

    for (let i = 0; i < sortedDays.length; i++) {
      const dayStr = sortedDays[i];
      const todayStr = new Date().toISOString().slice(0,10);
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0,10);
      
      if (i === 0) {
        // If first day is today or yesterday, streak is alive
        if (dayStr === todayStr || dayStr === yesterdayStr) {
          tempStreak = 1;
        } else {
          break; // Streak broken
        }
      } else {
        const prevDay = new Date(sortedDays[i-1]);
        const currDay = new Date(dayStr);
        const diffDays = Math.round((prevDay - currDay) / 86400000);
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          break;
        }
      }
    }
    currentStreak = tempStreak;

    // A simple longest streak logic over all unique days
    const allSortedDays = Array.from(uniqueStudyDays).sort();
    let lTemp = 0;
    for(let i=0; i<allSortedDays.length; i++) {
      if (i === 0) { lTemp = 1; longestStreak = 1; continue; }
      const diff = Math.round((new Date(allSortedDays[i]) - new Date(allSortedDays[i-1])) / 86400000);
      if (diff === 1) {
        lTemp++;
        if (lTemp > longestStreak) longestStreak = lTemp;
      } else {
        lTemp = 1;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalMinutesToday,
        totalMinutesThisWeek,
        currentStreak,
        longestStreak,
        bySubject: subjectMap,
        byDayLast7,
        completionRate
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
