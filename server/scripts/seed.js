// Demo-data seeder. Creates (or refreshes) a demo account filled with
// realistic tasks, goals, notes, events, study sessions, flashcards,
// notifications and an AI conversation. All dates are relative to "now", so
// the dashboard, calendar, streaks and analytics always look current.
//
//   npm run seed                 create / refresh the demo account
//   npm run seed -- --remove     delete the demo account and all its data
//   SEED_EMAIL=you@x.com npm run seed -- --append
//                                add the sample data to an EXISTING account
//                                (nothing is deleted or changed; the account's
//                                name and password are left alone)
//
// Optional env: SEED_EMAIL, SEED_PASSWORD (else a random one is generated), SEED_NAME.
//
// Safety: the script only ever wipes data belonging to an account that the
// seeder itself created (marked with preferences.seeded = true). Pointing
// SEED_EMAIL at a real, existing account is refused, so it can never erase
// anyone's own data.
import '../src/config/env.js';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import Task from '../src/models/Task.model.js';
import Goal from '../src/models/Goal.model.js';
import Note from '../src/models/Note.model.js';
import Folder from '../src/models/Folder.model.js';
import Event from '../src/models/Event.model.js';
import StudySession from '../src/models/StudySession.model.js';
import StudyGoal from '../src/models/StudyGoal.model.js';
import Flashcard from '../src/models/Flashcard.model.js';
import Notification from '../src/models/Notification.model.js';
import Conversation from '../src/models/Conversation.model.js';

const EMAIL = (process.env.SEED_EMAIL || 'demo@ailifeos.app').toLowerCase();
// No password is committed to the repo: if SEED_PASSWORD is not set, a random
// one is generated for this run and printed once at the end.
const PASSWORD = process.env.SEED_PASSWORD || `Demo-${crypto.randomBytes(9).toString('base64url')}`;
const NAME = process.env.SEED_NAME || 'Demo User';
const REMOVE = process.argv.includes('--remove');
const APPEND = process.argv.includes('--append');

const OWNED = [Task, Goal, Note, Folder, Event, StudySession, StudyGoal, Flashcard, Notification, Conversation];

// ─── Date helpers (local time, relative to now) ──────────────
const NOW = new Date();
const day = (offset, hour = 9, minute = 0) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d;
};
const addMin = (d, m) => new Date(d.getTime() + m * 60000);

const wipe = (userId) => Promise.all(OWNED.map((M) => M.deleteMany({ userId })));

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set (server/.env).');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  // Host only — never print the connection string (it contains credentials).
  console.log(`Connected to database host: ${mongoose.connection.host}`);

  let user = await User.findOne({ email: EMAIL });
  if (APPEND) {
    if (REMOVE) throw new Error('--append and --remove cannot be combined.');
    if (!user) throw new Error(`No account found for ${EMAIL}. Sign up first, then run --append.`);
    console.log(`Appending sample data to existing account ${EMAIL} (nothing will be deleted)`);
  } else if (user && !user.preferences?.seeded) {
    throw new Error(`${EMAIL} is a real account (not created by the seeder). Refusing to wipe it. Use --append to add sample data to it instead.`);
  }

  if (REMOVE) {
    if (!user) { console.log(`No demo account ${EMAIL} — nothing to remove.`); return; }
    await wipe(user._id);
    await User.deleteOne({ _id: user._id });
    console.log(`Removed demo account ${EMAIL} and all its data.`);
    return;
  }

  if (APPEND) {
    // Existing account: add only. No wipe, no name/password change.
  } else if (user) {
    await wipe(user._id);
    user.name = NAME;
    user.password = PASSWORD; // re-hashed by the pre-save hook
    await user.save();
    console.log(`Refreshing demo account ${EMAIL}`);
  } else {
    user = await User.create({ name: NAME, email: EMAIL, password: PASSWORD, preferences: { seeded: true } });
    console.log(`Created demo account ${EMAIL}`);
  }
  const userId = user._id;
  const own = (docs) => docs.map((d) => ({ ...d, userId }));

  // ─── Folders ───────────────────────────────────────────────
  const [fWork, fLearning, fPersonal] = await Folder.insertMany(own([
    { name: 'Work', icon: 'briefcase', color: 'blue' },
    { name: 'Learning', icon: 'book', color: 'green' },
    { name: 'Personal', icon: 'user', color: 'amber' },
  ]));

  // ─── Goals (milestones: done/not done) ─────────────────────
  const ms = (titles, doneCount) =>
    titles.map((title, i) => ({
      id: `m${i + 1}`, title, week: i + 1, done: i < doneCount,
      ...(i < doneCount ? { completedAt: day(-(titles.length - i) * 3) } : {}),
    }));
  const goals = await Goal.insertMany(own([
    {
      title: 'Launch AILifeOS v1', description: 'Ship the first public release with auth, tasks, goals and AI assistant.',
      status: 'active', category: 'project', color: 'blue', icon: 'rocket',
      startDate: day(-30), dueDate: day(21),
      milestones: ms(['Backend API', 'Auth & security', 'Dashboard UI', 'Deploy to Vercel', 'Public beta'], 3),
    },
    {
      title: 'Master system design', description: 'Be interview-ready for senior backend roles.',
      status: 'active', category: 'learning', color: 'green', icon: 'brain',
      startDate: day(-20), dueDate: day(40),
      milestones: ms(['Scalability basics', 'Caching & CDNs', 'Databases & sharding', 'Message queues', 'Mock interviews'], 2),
    },
    {
      title: 'Solve 150 DSA problems', description: 'Two problems a day, focusing on graphs and DP.',
      status: 'on-track', category: 'learning', color: 'amber', icon: 'code',
      startDate: day(-45), dueDate: day(30),
      milestones: ms(['Arrays & hashing', 'Two pointers', 'Trees', 'Graphs', 'Dynamic programming'], 3),
    },
    {
      title: 'Run a half marathon', description: 'Build up to 21 km by the city race.',
      status: 'active', category: 'health', color: 'red', icon: 'heart',
      startDate: day(-60), dueDate: day(50),
      milestones: ms(['5 km without stopping', '10 km run', '15 km long run', 'Race day'], 2),
    },
    {
      title: 'Read 12 books this year', description: 'One book a month — tech and non-fiction.',
      status: 'completed', category: 'personal', color: 'coffee', icon: 'book',
      startDate: day(-300), dueDate: day(-5),
      milestones: ms(['Q1: 3 books', 'Q2: 3 books', 'Q3: 3 books', 'Q4: 3 books'], 4),
    },
  ]));
  const [gLaunch, gDesign, gDsa, gRun] = goals;

  // ─── Tasks ─────────────────────────────────────────────────
  const sub = (items, done = 0) => items.map((text, i) => ({ id: `s${i + 1}`, text, done: i < done }));
  const open = (title, extra) => ({ title, status: 'todo', ...extra });
  const done = (title, daysAgo, extra) => ({ title, status: 'done', completedAt: day(-daysAgo, 17), dueDate: day(-daysAgo, 18), ...extra });

  await Task.insertMany(own([
    // Today
    open('Finalize Q4 product roadmap', { priority: 'high', category: 'work', dueDate: day(0, 11), time: '11:00', duration: 90, project: 'AILifeOS', goalId: gLaunch._id, tags: ['planning'], subtasks: sub(['Collect feedback', 'Prioritise features', 'Share with team'], 1) }),
    { title: 'Review pull requests for auth module', status: 'in-progress', priority: 'medium', category: 'development', dueDate: day(0, 14), time: '14:00', duration: 45, project: 'AILifeOS', goalId: gLaunch._id, tags: ['code-review'] },
    open('Solve 2 graph problems (BFS / DFS)', { priority: 'medium', category: 'dsa', dueDate: day(0, 19), duration: 60, goalId: gDsa._id, tags: ['leetcode'] }),
    open('Evening run — 5 km', { priority: 'low', category: 'personal', dueDate: day(0, 18, 30), time: '18:30', duration: 35, goalId: gRun._id }),
    // Overdue
    open('Update API documentation', { priority: 'high', category: 'development', dueDate: day(-2, 17), duration: 60, project: 'AILifeOS', tags: ['docs'] }),
    open('Pay electricity bill', { priority: 'medium', category: 'personal', dueDate: day(-1, 12), duration: 10 }),
    // Upcoming
    open('Write caching chapter notes', { priority: 'medium', category: 'learning', dueDate: day(1, 10), duration: 50, goalId: gDesign._id, tags: ['system-design'] }),
    { title: 'Set up Vercel preview deployments', status: 'review', priority: 'high', category: 'development', dueDate: day(1, 16), duration: 40, project: 'AILifeOS', goalId: gLaunch._id, subtasks: sub(['Configure env vars', 'Test preview URL', 'Document flow'], 2) },
    open('Dynamic programming: knapsack variants', { priority: 'medium', category: 'dsa', dueDate: day(2, 20), duration: 75, goalId: gDsa._id }),
    open('Prepare sprint demo', { priority: 'high', category: 'work', dueDate: day(3, 15), duration: 60, project: 'AILifeOS' }),
    open('Design database sharding diagram', { priority: 'low', category: 'learning', dueDate: day(4, 11), duration: 45, goalId: gDesign._id }),
    open('Long run — 12 km', { priority: 'medium', category: 'personal', dueDate: day(5, 7), time: '07:00', duration: 80, goalId: gRun._id }),
    open('Plan next month budget', { priority: 'low', category: 'personal', dueDate: day(6, 20), duration: 30 }),
    { title: 'Refactor notification service', status: 'in-progress', priority: 'medium', category: 'development', dueDate: day(7, 17), duration: 90, project: 'AILifeOS', tags: ['refactor'] },
    open('Read "Designing Data-Intensive Applications" ch. 5', { priority: 'low', category: 'learning', dueDate: day(8, 21), duration: 45, goalId: gDesign._id }),
    // Completed over the last two weeks (feeds streaks, weekly chart, heatmap)
    done('Ship dashboard redesign', 0, { priority: 'high', category: 'development', duration: 120, project: 'AILifeOS', goalId: gLaunch._id }),
    done('Morning workout', 0, { priority: 'low', category: 'personal', duration: 30 }),
    done('Write weekly update', 1, { priority: 'medium', category: 'work', duration: 25 }),
    done('Binary tree traversal problems', 1, { priority: 'medium', category: 'dsa', duration: 60, goalId: gDsa._id }),
    done('Refactor API client', 2, { priority: 'medium', category: 'development', duration: 90 }),
    done('10 km tempo run', 2, { priority: 'medium', category: 'personal', duration: 55, goalId: gRun._id }),
    done('Load-balancer notes', 3, { priority: 'low', category: 'learning', duration: 40, goalId: gDesign._id }),
    done('Fix timezone bug in streaks', 3, { priority: 'high', category: 'development', duration: 75, project: 'AILifeOS' }),
    done('Two-pointer problem set', 4, { priority: 'medium', category: 'dsa', duration: 50, goalId: gDsa._id }),
    done('Team retrospective', 5, { priority: 'medium', category: 'work', duration: 45 }),
    done('Set up JWT refresh flow', 6, { priority: 'high', category: 'development', duration: 100, goalId: gLaunch._id }),
    done('Grocery shopping', 6, { priority: 'low', category: 'personal', duration: 40 }),
    done('Sliding window problems', 8, { priority: 'medium', category: 'dsa', duration: 45 }),
    done('Client meeting prep', 9, { priority: 'high', category: 'work', duration: 60 }),
    done('Caching strategies reading', 11, { priority: 'low', category: 'learning', duration: 35 }),
    done('Write unit tests for tasks API', 13, { priority: 'medium', category: 'development', duration: 80 }),
  ]));

  // ─── Calendar events ───────────────────────────────────────
  const ev = (title, offset, hour, mins, extra = {}) => ({ title, start: day(offset, hour), end: addMin(day(offset, hour), mins), ...extra });
  await Event.insertMany(own([
    ev('Daily standup', 0, 10, 15, { category: 'work', color: 'blue', location: 'Google Meet' }),
    ev('Design review', 0, 16, 60, { category: 'project', color: 'green', description: 'Walk through the new solid UI.' }),
    ev('System design study block', 0, 20, 90, { category: 'learning', color: 'amber' }),
    ev('Daily standup', 1, 10, 15, { category: 'work', color: 'blue', location: 'Google Meet' }),
    ev('Investor sync', 1, 15, 45, { category: 'work', color: 'coffee', location: 'Zoom' }),
    ev('Gym — legs', 2, 7, 60, { category: 'health', color: 'red', location: 'Fitness First' }),
    ev('Mock interview with Priya', 3, 18, 60, { category: 'learning', color: 'amber', goalId: gDesign._id }),
    ev('Sprint planning', 4, 11, 90, { category: 'work', color: 'blue' }),
    ev('Long run — 12 km', 5, 7, 80, { category: 'health', color: 'red' }),
    ev('Family dinner', 6, 19, 120, { category: 'personal', color: 'coffee' }),
    ev('Product launch rehearsal', 9, 14, 120, { category: 'project', color: 'green' }),
    ev('Dentist appointment', -2, 11, 30, { category: 'health', color: 'red' }),
    ev('Hackathon', 12, 0, 0, { allDay: true, category: 'project', color: 'green', end: day(13, 23, 59) }),
  ]));

  // ─── Notes ─────────────────────────────────────────────────
  const notes = await Note.insertMany(own([
    {
      title: 'Q4 roadmap', folderId: fWork._id, pinned: true, tags: ['planning', 'work'],
      content: '# Q4 roadmap\n\n## Must ship\n- Solid single-theme UI\n- AI daily planner\n- Calendar ↔ task scheduling\n\n## Nice to have\n- Mobile layout polish\n- Weekly email digest\n\n> Ship small, ship often.',
    },
    {
      title: 'Meeting notes — design review', folderId: fWork._id, tags: ['meetings'],
      content: '# Design review\n\n**Attendees:** Manish, Priya, Arjun\n\n- Agreed on navy / teal palette\n- Remove gradients and animations\n- Sidebar: navy with teal active state\n\n## Action items\n- [x] Update tokens\n- [ ] Screenshot every page\n- [ ] Write release notes',
    },
    {
      title: 'Caching cheat sheet', folderId: fLearning._id, pinned: true, tags: ['system-design'],
      content: '# Caching\n\n| Strategy | When |\n|---|---|\n| Cache-aside | Read-heavy, tolerant of staleness |\n| Write-through | Must never serve stale data |\n| Write-back | Write-heavy, can tolerate loss |\n\n**Eviction:** LRU, LFU, TTL.\n\nRemember: *there are only two hard things…*',
    },
    {
      title: 'Graph algorithms', folderId: fLearning._id, tags: ['dsa', 'graphs'],
      content: '# Graphs\n\n- **BFS** — shortest path in unweighted graphs, O(V+E)\n- **DFS** — cycle detection, topological sort\n- **Dijkstra** — weighted, non-negative edges\n- **Union-Find** — connectivity, Kruskal\n\n```js\nconst bfs = (start) => {\n  const q = [start], seen = new Set([start])\n  while (q.length) { /* … */ }\n}\n```',
    },
    {
      title: 'Half-marathon training plan', folderId: fPersonal._id, tags: ['health', 'running'],
      content: '# Training plan\n\n- **Mon** — rest\n- **Tue** — 5 km easy\n- **Thu** — intervals 6×400 m\n- **Sat** — long run (+1 km every week)\n\nHydrate. Sleep 8 h.',
    },
    {
      title: 'Book list', folderId: fPersonal._id, tags: ['reading'],
      content: '# Reading\n\n1. Designing Data-Intensive Applications ✅\n2. Atomic Habits ✅\n3. The Pragmatic Programmer\n4. Deep Work',
    },
    {
      title: 'Interview prep checklist', tags: ['career'],
      content: '# Interview prep\n\n- [ ] Graphs & DP (daily)\n- [ ] 3 system-design mocks\n- [ ] Behavioural stories (STAR)\n- [x] Update résumé',
    },
  ]));

  // ─── Study sessions (last 3 weeks; duration is in seconds) ─
  const subjects = ['System Design', 'Algorithms', 'JavaScript', 'Databases'];
  const modes = ['pomodoro', 'deep-work', 'quick'];
  const moods = ['great', 'good', 'good', 'ok'];
  const places = ['home', 'library', 'cafe', 'home'];
  const sessions = [];
  for (let d = 20; d >= 0; d--) {
    if (d % 6 === 5) continue; // a couple of rest days
    const perDay = d % 3 === 0 ? 2 : 1;
    for (let k = 0; k < perDay; k++) {
      const i = d * 2 + k;
      const mode = modes[i % modes.length];
      const planned = mode === 'deep-work' ? 3000 : mode === 'pomodoro' ? 1500 : 900;
      const started = day(-d, k === 0 ? 8 + (i % 3) : 19, (i * 7) % 60);
      const duration = Math.round(planned * (0.85 + ((i * 13) % 15) / 100));
      sessions.push({
        subject: subjects[i % subjects.length], mode, plannedDuration: planned,
        duration: Math.min(duration, planned), completed: true,
        startedAt: started, endedAt: addMin(started, Math.round(duration / 60)),
        focusScore: 70 + ((i * 11) % 28), mood: moods[i % moods.length], environment: places[i % places.length],
        goalId: i % 2 ? gDesign._id : gDsa._id,
      });
    }
  }
  await StudySession.insertMany(own(sessions));

  await StudyGoal.insertMany(own([
    { subject: 'System Design', targetMinutesPerWeek: 300, active: true },
    { subject: 'Algorithms', targetMinutesPerWeek: 420, active: true },
    { subject: 'JavaScript', targetMinutesPerWeek: 180, active: true },
  ]));

  // ─── Flashcards (some due today) ───────────────────────────
  const card = (deckName, front, back, difficulty, dueIn, reviews = 0, correct = 0) => ({
    deckName, front, back, difficulty, nextReview: day(dueIn, 8), reviewCount: reviews, correctCount: correct,
    ...(reviews ? { lastReviewed: day(-2, 21) } : {}),
  });
  await Flashcard.insertMany(own([
    card('System Design', 'What is consistent hashing?', 'A hashing scheme that minimises key remapping when nodes are added or removed.', 'medium', 0, 3, 2),
    card('System Design', 'CAP theorem?', 'In a partition, a distributed system must choose between consistency and availability.', 'medium', 0, 4, 3),
    card('System Design', 'What does a CDN do?', 'Caches static content at edge locations close to users to cut latency.', 'easy', 2, 5, 5),
    card('System Design', 'Write-back vs write-through cache?', 'Write-back defers DB writes (fast, risk of loss); write-through writes both synchronously.', 'hard', -1, 2, 1),
    card('Algorithms', 'Time complexity of Dijkstra with a binary heap?', 'O((V + E) log V)', 'hard', 0, 3, 1),
    card('Algorithms', 'When to use BFS over DFS?', 'Shortest path in unweighted graphs; level-order traversal.', 'easy', 3, 6, 6),
    card('Algorithms', 'What is memoization?', 'Caching results of expensive function calls to avoid recomputation.', 'easy', 1, 4, 4),
    card('Algorithms', 'Topological sort works on…?', 'Directed acyclic graphs (DAGs).', 'medium', 0),
    card('JavaScript', 'Difference between == and ===?', '=== compares without type coercion; == coerces types first.', 'easy', 4, 7, 7),
    card('JavaScript', 'What is the event loop?', 'The mechanism that runs queued callbacks/microtasks when the call stack is empty.', 'medium', 0, 2, 1),
    card('JavaScript', 'What does Promise.allSettled return?', 'An array of {status, value|reason} for every promise, never rejecting.', 'medium', 2),
  ]).map((c, i) => (i === 0 ? { ...c, noteId: notes[2]._id } : c)));

  // ─── Notifications ─────────────────────────────────────────
  await Notification.insertMany(own([
    { type: 'task', title: 'Task due today', message: '"Finalize Q4 product roadmap" is due at 11:00.', link: '/tasks', read: false },
    { type: 'goal', title: 'Milestone reached', message: 'You completed "Dashboard UI" in Launch AILifeOS v1. 🎉', link: '/goals', read: false },
    { type: 'study', title: 'Flashcards due', message: '6 cards are ready for review.', link: '/study', read: false },
    { type: 'system', title: 'Welcome to AILifeOS', message: 'This is a demo account filled with sample data.', link: '/dashboard', read: true },
  ]));

  // ─── AI assistant conversation ─────────────────────────────
  await Conversation.insertMany(own([
    {
      title: 'Plan my week',
      isPinned: true,
      messages: [
        { role: 'user', content: 'Help me plan this week. I want to ship the dashboard and keep up with DSA.', timestamp: day(-1, 21) },
        { role: 'assistant', content: 'Here is a balanced plan:\n\n1. **Mornings (deep work):** dashboard + roadmap tasks, 90-minute blocks.\n2. **Evenings:** 2 DSA problems a day — graphs Mon–Wed, DP Thu–Fri.\n3. **Saturday:** long run, then review flashcards.\n\nWant me to add these as tasks?', timestamp: day(-1, 21, 1) },
        { role: 'user', content: 'Yes, and keep Sunday free.', timestamp: day(-1, 21, 3) },
        { role: 'assistant', content: 'Done — tasks are scheduled Monday to Saturday and Sunday is left open. 🙌', timestamp: day(-1, 21, 3) },
      ],
    },
    {
      title: 'Explain consistent hashing',
      messages: [
        { role: 'user', content: 'Explain consistent hashing simply.', timestamp: day(-3, 20) },
        { role: 'assistant', content: 'Imagine servers placed on a clock face. Each key goes to the next server clockwise. Adding a server only moves the keys between it and its neighbour, instead of reshuffling everything.', timestamp: day(-3, 20, 1) },
      ],
    },
  ]));

  const counts = await Promise.all(OWNED.map((M) => M.countDocuments({ userId })));
  console.log('\nSeeded:');
  OWNED.forEach((M, i) => console.log(`  ${M.modelName.padEnd(13)} ${counts[i]}`));
  if (APPEND) console.log(`\nDone. Sign in to ${EMAIL} with your usual password and refresh the dashboard.`);
  else console.log(`\nSign in with:\n  email:    ${EMAIL}\n  password: ${process.env.SEED_PASSWORD ? '(the SEED_PASSWORD you set)' : `${PASSWORD}   (generated for this run; save it)`}`);
}

main()
  .catch((err) => { console.error(`Seed failed: ${err.message}`); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
