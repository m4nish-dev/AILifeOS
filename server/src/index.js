import './config/env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
// In the unified Vercel deployment the SPA and the API share one origin, so
// most real traffic is same-origin and never hits CORS at all. We therefore
// keep the allow-list strict instead of trusting every *.vercel.app host
// (which previously let any third-party Vercel site call this API).
const buildAllowedOrigins = () => {
  const listed = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const origins = [...listed];

  // Vercel injects VERCEL_URL with this deployment's own host (no protocol).
  if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`);

  // Local dev servers — only outside production.
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:5173', 'http://localhost:3000');
  }

  return [...new Set(origins)];
};

const allowedOrigins = buildAllowedOrigins();

// Opt-in escape hatch for Vercel preview deployments on separate origins.
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';

const corsOptions = {
  origin: (origin, callback) => {
    // No Origin header = same-origin navigation, curl, or server-to-server.
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Handle preflight for ALL routes FIRST — must be before any route/middleware
app.use(cors(corsOptions));

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

app.get('/', apiIndex);
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

// ─── Start server (local dev only) ────────────────────────
// On Vercel (NODE_ENV === 'production') we export the app as a serverless
// handler and must NOT call app.listen. The DB connection is established
// lazily per-request by the middleware above.
const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'production') {
  // Eagerly connect in local dev for faster first request + clear startup logs.
  // Never crash the dev server if the DB is unreachable — just log it.
  connectDB().catch((err) => {
    console.error(`[DB] Initial connection failed: ${err.message}`);
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;
