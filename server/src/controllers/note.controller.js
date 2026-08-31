import Note from '../models/Note.model.js';

// @desc   Get all notes
// @route  GET /api/notes
// @access Protected
export const getNotes = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    
    if (req.query.pinned === 'true') filter.pinned = true;
    if (req.query.pinned === 'false') filter.pinned = false;
    
    if (req.query.tag) filter.tags = req.query.tag.toLowerCase();

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Sort: pinned first, then updatedAt desc
    // Since we can't reliably sort by a boolean and date together across different query planners easily, 
    // mongoose sort takes multiple fields. true is considered > false, but in descending order it's what we want.
    const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Notes fetched successfully.',
      data: { notes, count: notes.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single note
// @route  GET /api/notes/:id
// @access Protected
export const getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, message: 'Note fetched', data: { note } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create note
// @route  POST /api/notes
// @access Protected
export const createNote = async (req, res) => {
  try {
    const note = await Note.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, message: 'Note created', data: { note } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update note
// @route  PUT /api/notes/:id
// @access Protected
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowed = ['title', 'content', 'tags', 'pinned', 'color'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) note[field] = req.body[field];
    });

    await note.save();

    res.status(200).json({ success: true, message: 'Note updated', data: { note } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete note
// @route  DELETE /api/notes/:id
// @access Protected
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await note.deleteOne();
    res.status(200).json({ success: true, message: 'Note deleted', data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Toggle pin
// @route  PATCH /api/notes/:id/pin
// @access Protected
export const togglePin = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    note.pinned = !note.pinned;
    await note.save();

    res.status(200).json({ success: true, message: 'Note pin toggled', data: { note } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Add tag
// @route  POST /api/notes/:id/tags
// @access Protected
export const addTag = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { tag } = req.body;
    if (!tag || !tag.trim()) return res.status(400).json({ success: false, message: 'Tag is required' });

    const normalizedTag = tag.trim().toLowerCase();
    if (!note.tags.includes(normalizedTag)) {
      note.tags.push(normalizedTag);
      await note.save();
    }

    res.status(200).json({ success: true, message: 'Tag added', data: { note } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Remove tag
// @route  DELETE /api/notes/:id/tags/:tag
// @access Protected
export const removeTag = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const tagToRemove = req.params.tag.toLowerCase();
    note.tags = note.tags.filter(t => t !== tagToRemove);
    await note.save();

    res.status(200).json({ success: true, message: 'Tag removed', data: { note } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
