import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    deckName: {
      type: String,
      required: true,
      trim: true
    },
    front: {
      type: String,
      required: true
    },
    back: {
      type: String,
      required: true
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    lastReviewed: {
      type: Date
    },
    nextReview: {
      type: Date,
      default: Date.now
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    correctCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model('Flashcard', flashcardSchema);
