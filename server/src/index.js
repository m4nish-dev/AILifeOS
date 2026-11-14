import './config/env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import goalRoutes from './routes/goal.routes.js';
import noteRoutes from './routes/note.routes.js';
import folderRoutes from './routes/folder.routes.js';
import eventRoutes from './routes/event.routes.js';
import studyRoutes from './routes/study.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import searchRoutes from './routes/search.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// Vercel/most PaaS put the app behind exactly one proxy hop. This makes req.ip
// reflect the real client IP so rate limiting keys on the user, not the proxy.
app.set('trust proxy', 1);

// ─── Security headers ─────────────────────────────────────
// This process only serves JSON (the SPA is served as static files by Vercel),
// so CSP is unnecessary here, and CORP must be cross-origin so browsers on a
// different origin can read API responses.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────
// Browsers send an Origin header on every POST/PUT/PATCH/DELETE — including
// same-origin ones — so the SPA's own writes DO pass through this check. An
// earlier version only allowed VERCEL_URL (the per-deployment hostname), which
// is not the production alias the site is actually served from; every login and
// save from the live site was rejected with 403.
//
// Rule: same-origin is always allowed (the Origin's host equals the host the
// request was sent to), plus an explicit allow-list for genuinely cross-origin
// clients. Foreign sites are still refused.
const buildAllowedOrigins = () => {
  const listed = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const origins = [...listed];
  // Vercel system variables (hostnames without protocol).
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) origins.push(`https://${host}`);
  }
  return [...new Set(origins)];
};

const allowedOrigins = buildAllowedOrigins();
const isDev = process.env.NODE_ENV !== 'production';

// Opt-in escape hatch for Vercel preview deployments on separate origins.
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';

const isSameOrigin = (origin, req) => {
  try {
    const originHost = new URL(origin).host;
    const requestHost = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    return Boolean(requestHost) && originHost === requestHost;
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin, req) => {
  if (allowedOrigins.includes(origin)) return true;
  if (isSameOrigin(origin, req)) return true;
  // Any local dev server, any port (Vite, CRA, previews) — never in production.
  if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  return false;
};

const corsBase = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Delegate form so the decision can see the request's own Host header.
const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  // No Origin header = same-origin GET, navigation, curl, or server-to-server.
  if (!origin || isAllowedOrigin(origin, req)) return callback(null, { ...corsBase, origin: true });
  callback(new Error(`CORS: Origin ${origin} not allowed`));
};

// Handle preflight for ALL routes FIRST — must be before any route/middleware
app.use(cors(corsOptionsDelegate));

// ─── Body parsers (size-capped to avoid memory-exhaustion DoS) ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Health checks (no DB required, never rate limited) ───
const health = (_req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() });
app.get('/health', health);
app.get('/api/health', health);

// ─── Home / API index (no DB required, never rate limited) ─
// Returns a short description of the API instead of a bare 404.
//
// Which path reaches this depends on how the app is served:
//   - standalone (local dev, or a backend-only host):  GET /
//   - unified Vercel deployment:                       GET /api
// On Vercel, vercel.json routes only /api/* to this function and serves the
// SPA at "/", so "/" below is never hit there. Both are registered so the
// backend answers sensibly either way.
const apiIndex = (_req, res) =>
  res.status(200).json({
    success: true,
    name: 'AILifeOS API',
    status: 'running',
    health: '/api/health',
    docs: 'https://github.com/m4nish-dev/AILifeOS#-api-overview',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks',
      goals: '/api/goals',
      notes: '/api/notes',
      folders: '/api/folders',
      events: '/api/events',
      study: '/api/study',
      dashboard: '/api/dashboard',
      analytics: '/api/analytics',
      search: '/api/search',
      notifications: '/api/notifications',
      ai: '/api/ai',
    },
  });

// ─── Built frontend (single-server deployments) ───────────
// On hosts that run one Node process (Render, Railway, Fly, Docker, a VPS),
// serve the built SPA from client/dist when it exists, so one service runs the
// whole app with no CORS setup. On Vercel the SPA is served by the static
// build instead, and in local dev Vite serves it, so this stays inactive there.
const CLIENT_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
const serveClient = !process.env.VERCEL && fs.existsSync(path.join(CLIENT_DIST, 'index.html'));
if (serveClient) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
} else {
  app.get('/', apiIndex);
}
app.get('/api', apiIndex);

// ─── Rate limiting ────────────────────────────────────────
// Note: the default in-memory store is per-instance. On serverless that means
// limits apply per warm instance rather than globally — still useful, but a
// shared store (e.g. Redis) would be required for strict global limits.
const makeLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ success: false, message }),
  });

// Strict: credential endpoints are the brute-force target.
const authLimiter = makeLimiter(
  15 * 60 * 1000,
  20,
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// AI calls cost money and are slow — keep them well below the global budget.
const aiLimiter = makeLimiter(
  15 * 60 * 1000,
  40,
  'AI request limit reached. Please wait a few minutes before trying again.'
);

// Generous catch-all for normal app usage.
const apiLimiter = makeLimiter(
  15 * 60 * 1000,
  600,
  'Too many requests. Please slow down and try again shortly.'
);

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', aiLimiter);

// ─── Ensure DB is connected before any API request ────────
// On Vercel each request runs in a serverless function, so we lazily (and
// cache-backed) establish the connection here instead of at boot. The health
// checks above are intentionally NOT behind this, so they work even if the DB
// is down. Preflight OPTIONS requests are already answered by the CORS
// middleware and never reach this point.
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(`[DB] Request blocked — connection unavailable: ${err.message}`);
    res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again in a moment.',
    });
  }
});

// ─── Routes ───────────────────────────────────────────────
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

// SPA fallback: any non-API GET that wants HTML gets index.html, so deep links
// and page refreshes (e.g. /tasks) work on single-server deployments.
if (serveClient) {
  app.get(/^\/(?!api(\/|$)).*/, (req, res, next) => {
    if (!req.accepts('html')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

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

  // Oversized request bodies surface as a generic parser error.
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large (limit 1MB).' });
  }

  // Malformed JSON from the client is a 400, not a 500.
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body.' });
  }

  console.error(`[Error] ${err.stack || err.message}`);

  const statusCode = err.statusCode || 500;

  // Never leak internal error text for 5xx in production — it can expose
  // database field names, file paths and query internals.
  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({ success: false, message });
});

// ─── Start server ─────────────────────────────────────────
// Vercel imports this module as a serverless handler, so it must NOT listen.
// Everywhere else (local dev, Render, Railway, Fly, Docker, a VPS) we listen —
// including NODE_ENV=production. The check is Vercel's own VERCEL variable,
// not NODE_ENV: gating on NODE_ENV made `NODE_ENV=production npm start` exit
// immediately on every non-Vercel host.
const PORT = process.env.PORT || 5001;
if (!process.env.VERCEL) {
  // Eager connect for a fast first request + clear startup logs.
  // Never crash if the DB is unreachable: requests return 503 until it is up.
  connectDB().catch((err) => {
    console.error(`[DB] Initial connection failed: ${err.message}`);
  });

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  // Graceful shutdown: container platforms send SIGTERM on every redeploy.
  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down…`);
    server.close(async () => {
      try { await mongoose.connection.close(); } catch { /* already closed */ }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
