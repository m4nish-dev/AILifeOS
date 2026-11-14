import Folder from '../models/Folder.model.js';
import Note from '../models/Note.model.js';

// @desc   Get all folders for the authenticated user
// @route  GET /api/folders
// @access Protected
export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      message: 'Folders fetched successfully.',
      data: { folders, count: folders.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create a folder
// @route  POST /api/folders
// @access Protected
export const createFolder = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required.' });
    }

    const folder = await Folder.create({
      userId: req.user._id,
      name: name.trim(),
      ...(icon !== undefined ? { icon } : {}),
      ...(color !== undefined ? { color } : {})
    });

    res.status(201).json({ success: true, message: 'Folder created', data: { folder } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A folder with this name already exists.' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Update a folder
// @route  PUT /api/folders/:id
// @access Protected
export const updateFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });
    if (folder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowed = ['name', 'icon', 'color'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) folder[field] = req.body[field];
    });

    await folder.save();
    res.status(200).json({ success: true, message: 'Folder updated', data: { folder } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A folder with this name already exists.' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Delete a folder (notes are kept, just un-filed)
// @route  DELETE /api/folders/:id
// @access Protected
export const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });
    if (folder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Deleting a folder must never destroy the user's notes — detach them.
    await Note.updateMany(
      { userId: req.user._id, folderId: folder._id },
      { $unset: { folderId: '' } }
    );

    await folder.deleteOne();

    res.status(200).json({ success: true, message: 'Folder deleted. Its notes were kept.', data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
