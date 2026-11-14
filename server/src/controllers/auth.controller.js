import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Task from '../models/Task.model.js';
import Goal from '../models/Goal.model.js';
import Note from '../models/Note.model.js';
import Event from '../models/Event.model.js';
import StudySession from '../models/StudySession.model.js';
import Conversation from '../models/Conversation.model.js';
import Flashcard from '../models/Flashcard.model.js';
import StudyGoal from '../models/StudyGoal.model.js';
import Notification from '../models/Notification.model.js';
import Folder from '../models/Folder.model.js';

// Helper: generate a signed JWT
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    // Readable server-side error instead of jsonwebtoken's
    // "secretOrPrivateKey must have a value".
    const err = new Error('Server misconfigured: JWT_SECRET is not set.');
    err.statusCode = 500;
    throw err;
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user (password hashed via pre-save hook)
    // Sign the token BEFORE saving: if signing fails (e.g. missing JWT_SECRET)
    // no half-created account is left behind that blocks a retry.
    const user = new User({ name, email, password });
    const token = generateToken(user._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          preferences: user.preferences,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    // Handle mongoose duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          preferences: user.preferences,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get current logged-in user
// @route  GET /api/auth/me
// @access Protected
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User fetched successfully.',
      data: { user: req.user },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update user profile
// @route  PUT /api/auth/profile
// @access Protected
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;

    // Changing email must not silently collide with another account.
    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
      const nextEmail = req.body.email.toLowerCase().trim();
      const taken = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
      if (taken) {
        return res.status(409).json({ success: false, message: 'That email is already in use.' });
      }
      user.email = nextEmail;
    }

    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
    if (req.body.preferences) {
      user.preferences = { ...user.preferences, ...req.body.preferences };
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        preferences: updatedUser.preferences,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Change user password
// @route  PUT /api/auth/password
// @access Protected
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook will hash it

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete account & cascade
// @route  DELETE /api/auth/account
// @access Protected
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Remove every collection that references this user, otherwise orphaned
    // rows survive the account deletion.
    await Promise.all([
      Task.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      Note.deleteMany({ userId }),
      Folder.deleteMany({ userId }),
      Event.deleteMany({ userId }),
      StudySession.deleteMany({ userId }),
      StudyGoal.deleteMany({ userId }),
      Flashcard.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Conversation.deleteMany({ userId }),
    ]);

    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: 'Account and all data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Export user data
// @route  GET /api/auth/export
// @access Protected
export const exportData = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      user, tasks, goals, notes, folders, events,
      studySessions, studyGoals, flashcards, notifications, conversations
    ] = await Promise.all([
      User.findById(userId).select('-password'),
      Task.find({ userId }),
      Goal.find({ userId }),
      Note.find({ userId }),
      Folder.find({ userId }),
      Event.find({ userId }),
      StudySession.find({ userId }),
      StudyGoal.find({ userId }),
      Flashcard.find({ userId }),
      Notification.find({ userId }),
      Conversation.find({ userId })
    ]);

    const data = {
      user,
      tasks,
      goals,
      notes,
      folders,
      events,
      studySessions,
      studyGoals,
      flashcards,
      notifications,
      conversations,
      exportedAt: new Date()
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
