export const dashboardStats = {
  tasksToday:      { value: 5, sub: '2 left', trend: null },
  weeklyCompletion:{ value: 72, sub: '↑ 14% vs last week', trend: 'up' },
  focusTime:       { value: 4.5, sub: '↑ 1.2h vs yesterday', trend: 'up' },
  activeGoals:     { value: 3, sub: '1 on track', trend: null },
}

export const focusBreakdown = [
  { label: 'Development', hours: 2.1, color: 'var(--green-600)' },
  { label: 'DSA',         hours: 1.2, color: 'var(--amber-500)' },
  { label: 'Learning',    hours: 0.8, color: 'var(--coffee-600)' },
  { label: 'Other',       hours: 0.4, color: 'var(--text-tertiary)' },
]

export const weeklyProductivity = [
  { day: 'Mon', value: 68 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 55 },
  { day: 'Thu', value: 80 },
  { day: 'Fri', value: 45 },
  { day: 'Sat', value: 30 },
  { day: 'Sun', value: 60 },
]

export const recentActivity = [
  { id: 'a1', type: 'done',    text: 'Completed: React Router Notes', time: '2h ago' },
  { id: 'a2', type: 'created', text: 'Created: API Auth Module',      time: '5h ago' },
  { id: 'a3', type: 'goal',    text: 'Goal progress +8%',              time: '1 day ago' },
  { id: 'a4', type: 'ai',      text: 'AI rescheduled 2 tasks',         time: '1 day ago' },
]
