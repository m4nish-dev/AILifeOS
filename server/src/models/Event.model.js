import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
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
      default: ''
    },
    start: {
      type: Date,
      required: true,
      index: true
    },
    end: {
      type: Date,
      required: true
    },
    allDay: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      enum: ['green', 'coffee', 'amber', 'red', 'blue'],
      default: 'blue'
    },
    category: {
      type: String,
      enum: ['work', 'learning', 'project', 'personal', 'health'],
      default: 'work'
    },
    location: {
      type: String,
      default: ''
    },
    recurring: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      until: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

eventSchema.pre('save', function () {
  if (this.end && this.start && this.end <= this.start) {
    throw new Error('End date must be strictly after start date.');
  }
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
