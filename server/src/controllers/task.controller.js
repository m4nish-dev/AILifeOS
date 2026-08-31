import Task from '../models/Task.model.js';

// @desc   Get all tasks for the authenticated user
// @route  GET /api/tasks
// @access Protected
export const getTasks = async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;
    const filter = { userId: req.user._id };

    if (status)   filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Tasks fetched successfully.',
      data: { tasks, count: tasks.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single task
// @route  GET /api/tasks/:id
// @access Protected
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this task.' });
    }

    res.status(200).json({ success: true, message: 'Task fetched.', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create a new task
// @route  POST /api/tasks
// @access Protected
export const createTask = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const task = await Task.create({ ...req.body, userId: req.user._id });

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update a task
// @route  PUT /api/tasks/:id
// @access Protected
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task.' });
    }

    // Apply updates field by field (never overwrite userId)
    const allowed = ['title', 'description', 'status', 'priority', 'dueDate', 'category', 'project', 'time', 'duration', 'tags', 'subtasks'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save(); // triggers pre-save hook for completedAt

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete a task
// @route  DELETE /api/tasks/:id
// @access Protected
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task.' });
    }

    await task.deleteOne();

    res.status(200).json({ success: true, message: 'Task deleted successfully.', data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
