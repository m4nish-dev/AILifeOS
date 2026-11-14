export const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return getStartOfDay(new Date(d.setDate(diff)));
};

export const percentChange = (current, previous) => {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${Math.round(change)}%`;
};

// ─── User-local calendar days ────────────────────────────────
// The server runs in UTC (Vercel), but "today", streaks and day buckets must
// follow the user's own calendar. The browser sends its offset as tzOffset —
// exactly Date.prototype.getTimezoneOffset(): minutes, UTC minus local (so
// IST is -330). All arithmetic below is on UTC fields of shifted instants, so
// the result never depends on the server's own timezone.
const DAY_MS = 86400000;

export const readTzOffset = (req) => {
  const n = Number(req?.query?.tzOffset);
  return Number.isFinite(n) && Math.abs(n) <= 840 ? Math.round(n) : 0;
};

// 'YYYY-MM-DD' of `date` on the user's calendar.
export const localDayKey = (date, tz = 0) =>
  new Date(new Date(date).getTime() - tz * 60000).toISOString().slice(0, 10);

// The last n local day keys, oldest first, ending today.
export const recentDayKeys = (n, tz = 0) => {
  const today = Date.parse(`${localDayKey(new Date(), tz)}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => new Date(today - (n - 1 - i) * DAY_MS).toISOString().slice(0, 10));
};

// The UTC instant at which a local day key begins (for $gte queries).
export const localMidnightUtc = (key, tz = 0) => new Date(Date.parse(`${key}T00:00:00Z`) + tz * 60000);

export const localHour = (tz = 0, now = new Date()) => new Date(new Date(now).getTime() - tz * 60000).getUTCHours();

// 0 = Sunday, on the user's calendar.
export const localWeekday = (date, tz = 0) => new Date(new Date(date).getTime() - tz * 60000).getUTCDay();

// Monday 00:00 of the user's current week, as a UTC instant.
export const localWeekStartUtc = (tz = 0) => {
  const todayKey = localDayKey(new Date(), tz);
  const dow = new Date(`${todayKey}T00:00:00Z`).getUTCDay();
  const back = dow === 0 ? 6 : dow - 1;
  const mondayKey = new Date(Date.parse(`${todayKey}T00:00:00Z`) - back * DAY_MS).toISOString().slice(0, 10);
  return localMidnightUtc(mondayKey, tz);
};

export const weekdayLabel = (key) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

const prevDayKey = (key) => new Date(Date.parse(`${key}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);

// Consecutive active days ending today, or yesterday if nothing yet today.
// `keys` must be local day keys (localDayKey with the same tz). Pure string
// arithmetic: the old version mixed setDate() (server-local) with
// toISOString() (UTC) and drifted on any server not running in UTC.
export const streakFromDates = (keys, tz = 0) => {
  if (!keys || keys.length === 0) return 0;
  const days = new Set(keys);
  const today = localDayKey(new Date(), tz);
  let cursor = days.has(today) ? today : prevDayKey(today);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = prevDayKey(cursor);
  }
  return streak;
};
