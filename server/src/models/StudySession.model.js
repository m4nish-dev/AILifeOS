import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
    },
    subject: {
      type: String,
      trim: true,
      default: 'General Focus'
    },
    duration: {
      type: Number,
      default: 0 // seconds actually studied
    },
    plannedDuration: {
      type: Number,
      default: 1500 // 25 minutes default
    },
    mode: {
      type: String,
      enum: ['pomodoro', 'deep-work', 'quick'],
      default: 'pomodoro'
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ''
    },
    flashcardsReviewed: {
      type: Number,
      default: 0
    },
    focusScore: {
      type: Number,
      min: 0,
      max: 100
    },
    environment: {
      type: String,
      enum: ['home', 'library', 'cafe', 'other']
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'ok', 'struggling']
    },
    startedAt: {
      type: Date,
      required: true
    },
    endedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const StudySession = mongoose.model('StudySession', studySessionSchema);
export default StudySession;
