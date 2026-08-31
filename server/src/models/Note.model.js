import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
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
      maxlength: 200,
      default: 'Untitled Note'
    },
    content: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      set: (tags) => tags.map((t) => t.trim().toLowerCase())
    },
    pinned: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: 'default'
    }
  },
  {
    timestamps: true
  }
);

noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Note = mongoose.model('Note', noteSchema);
export default Note;
