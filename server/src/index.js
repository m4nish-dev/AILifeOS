import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Only load dotenv in local development — Vercel injects env vars directly
if (process.env.NODE_ENV !== 'production') {
  const { default: dotenv } = await import('dotenv');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import goalRoutes from './routes/goal.routes.js';
import noteRoutes from './routes/note.routes.js';
import eventRoutes from './routes/event.routes.js';
import studyRoutes from './routes/study.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import searchRoutes from './routes/search.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────
// Build a list of allowed origins from the environment.
// CLIENT_URL can be a comma-separated list for multiple Vercel preview URLs.
const buildAllowedOrigins = () => {
  const raw = process.env.CLIENT_URL || '';
  // Split by comma, trim whitespace, filter empty strings
  const listed = raw.split(',').map(o => o.trim()).filter(Boolean);

  const defaults = ['http://localhost:5173', 'http://localhost:3000'];

  // Always allow any *.vercel.app subdomain by using a dynamic check below
  return [...new Set([...defaults, ...listed])];
};

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow if explicitly listed
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow any *.vercel.app subdomain (covers all Vercel preview/prod URLs)
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return callback(null, true);

    // Deny everything else
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Handle preflight for ALL routes FIRST — must be before any route/middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
app.get('/api/health', (_req, res) => res.redirect('/health'));

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Don't leak CORS error details — just send 403
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: 'CORS: Origin not allowed' });
  }
  console.error(`[Error] ${err.stack}`);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Start server (local dev only) ────────────────────────
const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Connect to MongoDB (non-blocking — server stays up even if DB is slow)
connectDB();

export default app;
