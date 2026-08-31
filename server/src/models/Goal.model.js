import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  id: { type: String }, // Frontend uses id: m123...
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  week: { type: Number },
  completedAt: { type: Date }
});

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'on-track'],
      default: 'active'
    },
    dueDate: { type: Date },
    color: {
      type: String,
      enum: ['green', 'coffee', 'amber', 'red', 'blue'],
      default: 'green'
    },
    category: {
      type: String,
      default: 'personal'
    },
    icon: { type: String, default: 'target' }, // From frontend emptyGoal
    milestones: [milestoneSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for progress
goalSchema.virtual('progress').get(function () {
  if (!this.milestones || this.milestones.length === 0) return 0;
  const done = this.milestones.filter((m) => m.done).length;
  return Math.round((done / this.milestones.length) * 100);
});

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
