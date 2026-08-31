# AI LifeOS — Client

Frontend for AI LifeOS, a personal operating system for daily life.

## Stack
- React 18 + Vite
- React Router v6
- Lucide React (icons)
- Framer Motion (animations, ready for later)
- Recharts (charts, ready for later)
- Axios (API calls, ready for backend phase)

## Design tokens
Colors: green (primary), coffee (accent), red (danger) on white / light grey.
All tokens live in `src/styles/variables.css`.

## Getting started

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Structure

```
src/
├── components/
│   ├── layout/        # Sidebar, Topbar, MainLayout
│   ├── ui/            # Reusable atoms (empty for now)
│   └── dashboard/     # Dashboard widgets
├── pages/
│   └── Dashboard/     # First page built
├── data/              # Mock data (until backend)
├── styles/            # Global CSS + design tokens
├── utils/             # Helpers
└── App.jsx
```

## What's built (Phase 1)
- ✅ Sidebar navigation (with brand, workspaces, user card)
- ✅ Topbar (search, streak, notifications, avatar)
- ✅ Dashboard page:
  - Welcome header with dynamic greeting
  - 4 stat cards (Tasks, Weekly Completion, Focus Time, Active Goals)
  - Today's Plan (task rows with priority, duration, play button)
  - AI Insight banner (accept / ask actions + "Why?" panel)
  - Productivity Overview (weekly bar chart)
  - Quick Actions
  - Recent Activity feed
  - Right panel: Mini Calendar, Focus Ring, Active Goals, Assistant Mini
