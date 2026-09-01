import mongoose from 'mongoose';

const studyGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    targetMinutesPerWeek: {
      type: Number,
      required: true,
      default: 300 // 5 hours
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('StudyGoal', studyGoalSchema);
