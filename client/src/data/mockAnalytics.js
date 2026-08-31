export const weeklyProductivity = [
  { day: 'Mon', tasks: 8, focus: 4.5 },
  { day: 'Tue', tasks: 12, focus: 5.2 },
  { day: 'Wed', tasks: 6, focus: 3.8 },
  { day: 'Thu', tasks: 10, focus: 6.1 },
  { day: 'Fri', tasks: 14, focus: 5.5 },
  { day: 'Sat', tasks: 5, focus: 2.5 },
  { day: 'Sun', tasks: 3, focus: 1.2 },
]

export const categoryBreakdown = [
  { name: 'Learning', value: 35, color: '#F5A524' },
  { name: 'Work', value: 28, color: '#3B82F6' },
  { name: 'Project', value: 22, color: '#0E8C5A' },
  { name: 'Personal', value: 10, color: '#7A4E2D' },
  { name: 'Health', value: 5,  color: '#E23B3B' },
]

export const goalsProgress = [
  { name: 'Frontend Job', progress: 68, target: 100 },
  { name: 'AI LifeOS',    progress: 52, target: 100 },
  { name: 'DSA 450',      progress: 34, target: 100 },
  { name: 'Read 12 Books',progress: 28, target: 100 },
  { name: '10K Run',      progress: 100,target: 100 },
]

// GitHub-style heatmap: 12 weeks x 7 days
export const heatmapData = Array.from({ length: 84 }, (_, i) => ({
  day: i,
  count: Math.floor(Math.random() * 5),
}))

export const insights = [
  { icon: '🚀', title: 'Most productive day', text: 'Fridays are your peak — you complete 40% more tasks.', color: 'green' },
  { icon: '⚡', title: 'Best focus window', text: 'You focus deepest between 9-11 AM. Protect this window.', color: 'coffee' },
  { icon: '⚠️', title: 'Watch out', text: 'Weekend productivity drops sharply. Try lighter goals on Sat/Sun.', color: 'amber' },
  { icon: '🎯', title: 'On track', text: 'You\'re 4 days ahead on your Frontend Job goal — great pace!', color: 'green' },
]
