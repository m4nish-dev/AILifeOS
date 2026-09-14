import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../src/models/Task.model.js';
import Goal from '../src/models/Goal.model.js';
import Note from '../src/models/Note.model.js';
import Event from '../src/models/Event.model.js';
import StudySession from '../src/models/StudySession.model.js';

dotenv.config();

const createIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Creating Task indexes...');
    await Task.collection.createIndex({ userId: 1, status: 1 });
    await Task.collection.createIndex({ userId: 1, dueDate: 1 });

    console.log('Creating Goal indexes...');
    await Goal.collection.createIndex({ userId: 1, status: 1 });

    console.log('Creating Note indexes...');
    await Note.collection.createIndex({ userId: 1, updatedAt: -1 });

    console.log('Creating Event indexes...');
    await Event.collection.createIndex({ userId: 1, start: 1 });

    console.log('Creating StudySession indexes...');
    await StudySession.collection.createIndex({ userId: 1, startedAt: -1 });

    console.log('All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
};

createIndexes();
