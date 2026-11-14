import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    icon: {
      type: String,
      default: '📁'
    },
    color: {
      type: String,
      default: 'green'
    }
  },
  { timestamps: true }
);

// A user cannot have two folders with the same name.
folderSchema.index({ userId: 1, name: 1 }, { unique: true });

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
