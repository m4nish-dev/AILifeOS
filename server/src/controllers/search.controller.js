import Task from '../models/Task.model.js';
import Goal from '../models/Goal.model.js';
import Note from '../models/Note.model.js';
import Event from '../models/Event.model.js';

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, data: { tasks: [], goals: [], notes: [], events: [] } });
    }

    const userId = req.user._id;
    const regex = new RegExp(q, 'i');

    const [tasks, goals, notes, events] = await Promise.all([
      Task.find({ userId, $or: [{ title: regex }, { description: regex }] }).limit(5),
      Goal.find({ userId, $or: [{ title: regex }, { description: regex }] }).limit(5),
      Note.find({ userId, $or: [{ title: regex }, { content: regex }] }).limit(5),
      Event.find({ userId, $or: [{ title: regex }, { description: regex }] }).limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: { tasks, goals, notes, events }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
