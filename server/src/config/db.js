import mongoose from 'mongoose';

// Vercel runs each API request in a serverless function that may be a reused
// ("warm") instance or a fresh ("cold") one. Without caching, every cold start
// would open a brand-new connection pool and quickly exhaust the MongoDB Atlas
// connection limit. We cache the connection (and the in-flight connect promise)
// on the Node global so it survives across invocations on a warm instance.
let cached = global.__mongooseConn;
if (!cached) {
  cached = global.__mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  // Already connected on this warm instance — reuse it.
  if (cached.conn) return cached.conn;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Cannot connect to the database.');
  }

  // A connection attempt is already in flight (possibly from a concurrent
  // request) — await the same promise instead of starting a second one.
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        // Fail fast (5s) instead of hanging ~30s when the DB is unreachable,
        // so request handlers can return a clean error quickly.
        serverSelectionTimeoutMS: 5000,
      })
      .then((mongooseInstance) => {
        console.log(`✅ MongoDB connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset so the next request can retry rather than being stuck with a
    // permanently-rejected promise.
    cached.promise = null;
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

export default connectDB;
