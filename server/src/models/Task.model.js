import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: { type: Date },
    category: {
      type: String,
      enum: ['development', 'dsa', 'learning', 'work', 'personal'],
      default: 'personal',
    },
    project: { type: String, default: '', trim: true },
    time: { type: String, default: '' },
    duration: { type: Number, default: 30 },
    tags: [{ type: String, trim: true }],
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      index: true
    },
    subtasks: [
      {
        id: String,
        text: String,
        done: { type: Boolean, default: false },
      },
    ],
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound indexes matching the hot query paths (list/filter, due dates,
// analytics on completion time). Previously these lived only in a manual
// script, so fresh databases ran unindexed collection scans.
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, completedAt: -1 });

// Auto-set/clear completedAt when status changes
taskSchema.pre('save', function () {
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done') {
      this.completedAt = undefined;
    }
  }
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
