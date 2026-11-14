# AI LifeOS 🚀

AI LifeOS is an all-in-one personal productivity platform that brings together task management, goal tracking, notes, calendar events, and deep-work study sessions — all powered by an integrated AI assistant.

Built with the MERN stack (MongoDB, Express, React, Node.js) and deployed as a single Vercel project.

## ✨ Features

- **Smart Dashboard** — live summary of tasks, goals, upcoming events, recent notes, focus minutes, streaks and a productivity score.
- **Task Management** — list and Kanban views, priorities, categories, subtasks, filtering, and scheduling a task onto the calendar.
- **Goal Tracking** — long-term goals with milestones, automatic progress, and auto-completion when every milestone is done.
- **Calendar & Events** — Month / Week / Day views with drag-to-move.
- **Knowledge Base (Notes)** — markdown editing, persistent folders, tagging and pinning.
- **Study & Focus** — Pomodoro / deep-work timer, session history, focus-pattern heatmap, weekly subject goals, and flashcards with spaced repetition.
- **Analytics** — weekly productivity, category breakdown, goal progress, activity heatmap and generated insights.
- **AI Assistant** — context-aware chat grounded in your real data, note summarization, quiz generation, goal-roadmap generation, flashcard generation from notes, and PDF text ingestion.
- **Global Search** — search tasks, notes, goals and events with `Cmd/Ctrl + K`.
- **Notifications** — in-app notification centre.
- **Keyboard Shortcuts** — `Alt +` D/T/G/C/N/S/A to navigate; `Shift + ?` to view all.

## 🛠 Tech Stack

- **Frontend**: React 18 (Vite), React Router v6, Context API, Axios, Recharts, Framer Motion, Lucide Icons, vanilla CSS
- **Backend**: Node.js (≥18), Express 5
- **Database**: MongoDB Atlas (Mongoose)
- **AI**: Groq API — model `openai/gpt-oss-20b` (configured in `server/src/config/ai.js`)
- **Auth**: JWT (HS256) + bcryptjs
- **Security**: Helmet, CORS allow-list, express-rate-limit, request size limits

## 💻 Local Setup

**Prerequisites:** Node.js ≥ 18, and a MongoDB database (Atlas or local).

1. **Clone and install**

   ```bash
   git clone <your-repo-url> AILifeOS
   cd AILifeOS
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

2. **Configure the backend**

   ```bash
   cd server
   cp .env.example .env
   ```

   Fill in `server/.env`:

   | Variable | Required | Notes |
   |---|---|---|
   | `MONGODB_URI` | ✅ | Atlas or local connection string |
   | `JWT_SECRET` | ✅ | Long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `GROQ_API_KEY` | optional | From https://console.groq.com/keys. Without it the app runs fine; AI endpoints return a clear "not configured" error. |
   | `JWT_EXPIRES_IN` | optional | Defaults to `7d` |
   | `CLIENT_URL` | optional | Comma-separated extra CORS origins |
   | `PORT` | optional | Defaults to `5001` |

   The frontend needs no configuration — it calls a relative `/api` path, which Vite proxies to `localhost:5001` in dev.

3. **Run both apps** (from the repo root)

   ```bash
   npm run dev
   ```

   Frontend → http://localhost:5173 · Backend → http://localhost:5001

   Or run them separately with `npm run dev --prefix server` / `npm run dev --prefix client`.

## 🧪 Testing

An end-to-end API test suite exercises every module against a running server and a real database. It creates two throwaway users and deletes them afterwards.

```bash
# terminal 1
npm run dev --prefix server

# terminal 2
npm run test:api --prefix server
```

Options:

```bash
RUN_AI=false npm run test:api --prefix server          # skip live Groq calls
BASE=http://localhost:5001 npm run test:api --prefix server
PDF_FIXTURE=/path/to/file.pdf npm run test:api --prefix server   # also test PDF extraction
```

Indexes are declared on the schemas and created automatically by Mongoose. To force them on an existing database:

```bash
npm run create-indexes --prefix server
```

## 🌐 API Overview

All routes are prefixed with `/api`. Everything except `register`, `login` and the health checks requires an `Authorization: Bearer <token>` header, and every resource is scoped to the authenticated user.

| Module | Endpoints |
|---|---|
| **Health** | `GET /health`, `GET /api/health` (no DB required) |
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password`, `DELETE /auth/account`, `GET /auth/export` |
| **Tasks** | `GET|POST /tasks`, `GET|PUT|DELETE /tasks/:id`, `POST /tasks/:id/schedule` |
| **Goals** | `GET|POST /goals`, `GET|PUT|DELETE /goals/:id`, `POST /goals/:id/milestones`, `PATCH|DELETE /goals/:id/milestones/:milestoneId`, `GET /goals/:id/tasks` |
| **Notes** | `GET|POST /notes`, `GET|PUT|DELETE /notes/:id`, `PATCH /notes/:id/pin`, `POST /notes/:id/tags`, `DELETE /notes/:id/tags/:tag` |
| **Folders** | `GET|POST /folders`, `PUT|DELETE /folders/:id` |
| **Events** | `GET|POST /events`, `GET /events/range`, `GET|PUT|DELETE /events/:id`, `PATCH /events/:id/move` |
| **Study** | `POST|GET /study/sessions`, `GET|DELETE /study/sessions/:id`, `PUT /study/sessions/:id/end`, `GET /study/stats`, `/study/stats/subjects`, `/study/stats/focus-pattern` |
| **Study goals** | `GET|POST /study/goals`, `PUT|DELETE /study/goals/:id`, `GET /study/goals/progress` |
| **Flashcards** | `GET /study/flashcards/decks`, `/deck/:deckName`, `/due`, `POST /study/flashcards`, `PUT|DELETE /study/flashcards/:id`, `POST /study/flashcards/:id/review`, `POST /study/flashcards/generate/:noteId` |
| **Dashboard** | `GET /dashboard/summary` |
| **Analytics** | `GET /analytics/overview`, `/weekly-productivity`, `/category-breakdown`, `/goals-progress`, `/heatmap`, `/insights` |
| **Search** | `GET /search?q=` |
| **Notifications** | `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`, `DELETE /notifications/:id` |
| **AI** | `POST /ai/chat`, `GET /ai/conversations`, `GET|PUT|DELETE /ai/conversations/:id`, `POST /ai/goal-roadmap`, `POST /ai/summarize-note/:noteId`, `POST /ai/quiz/:noteId`, `POST /ai/upload-pdf` |

The AI chat also supports slash commands: `/task`, `/goal`, `/note`, `/event`.

## 🚀 Deployment (Vercel)

The repo deploys as **one** Vercel project. The root [`vercel.json`](./vercel.json) is the single authoritative config: it builds the client as a static site and `server/src/index.js` as a serverless function, routing `/api/*` to the backend and everything else to the SPA.

Because the SPA and API share one origin, the client uses a relative `/api` path and no CORS configuration is needed in the common case.

Set these in **Vercel → Project → Settings → Environment Variables**:

- `MONGODB_URI`
- `JWT_SECRET`
- `GROQ_API_KEY` (optional)
- `ALLOW_VERCEL_PREVIEWS=true` (only if you call the API cross-origin from preview deployments)

`NODE_ENV` is set to `production` by Vercel automatically — do not set it yourself. Mongoose connections are cached across warm invocations, so the function does not exhaust the Atlas connection limit.

## ⚠️ Known Limitations

- **PDF ingestion**: `pdf-parse` is pinned to `1.1.1` because the 2.x line pulls in `@napi-rs/canvas`, a native dependency that breaks on Vercel. That version bundles an old pdf.js build which cannot parse some valid PDFs (it reports an unsupported-structure error). Scanned/image-only PDFs are not supported at all — there is no OCR.
- **Rate limiting** uses an in-memory store, so limits apply per serverless instance rather than globally. A shared store (e.g. Redis) would be needed for strict global limits.
- **No password reset / email verification** flow yet.
- **AI responses are not streamed** — the assistant replies in one response.
- **List endpoints are not paginated** and return the full result set.
- The voice-agent architecture described in `VOICE_AGENT.md` is a **design document only** — it is not implemented.

## 📝 License

MIT.
