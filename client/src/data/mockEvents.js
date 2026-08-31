// Generate events relative to current date
const today = new Date()
const isoDate = (offset = 0, h = 9, m = 0) => {
  const d = new Date(today)
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const eventsData = [
  { id: 'e1', title: 'Team Standup', start: isoDate(0, 9, 30),  end: isoDate(0, 10, 0),  color: 'blue',   category: 'work' },
  { id: 'e2', title: 'DSA Practice',  start: isoDate(0, 12, 0),  end: isoDate(0, 13, 0),  color: 'amber',  category: 'learning' },
  { id: 'e3', title: 'Client Meeting',start: isoDate(0, 15, 0),  end: isoDate(0, 16, 30), color: 'coffee', category: 'work' },
  { id: 'e4', title: 'React Deep Dive',start: isoDate(1, 10, 0), end: isoDate(1, 12, 0),  color: 'green',  category: 'learning' },
  { id: 'e5', title: 'Gym',           start: isoDate(1, 18, 0),  end: isoDate(1, 19, 30), color: 'red',    category: 'health' },
  { id: 'e6', title: 'Portfolio Work',start: isoDate(2, 14, 0),  end: isoDate(2, 17, 0),  color: 'green',  category: 'project' },
  { id: 'e7', title: 'Dentist',       start: isoDate(3, 11, 0),  end: isoDate(3, 12, 0),  color: 'red',    category: 'personal' },
  { id: 'e8', title: 'Study Session', start: isoDate(4, 20, 0),  end: isoDate(4, 22, 0),  color: 'amber',  category: 'learning' },
  { id: 'e9', title: 'Review PRs',    start: isoDate(-1, 10, 0), end: isoDate(-1, 11, 0), color: 'blue',   category: 'work' },
  { id: 'e10', title: 'Weekly Planning', start: isoDate(-2, 9, 0), end: isoDate(-2, 10, 0), color: 'coffee', category: 'personal' },
]

export const EVENT_CATEGORIES = [
  { id: 'work',     label: 'Work',     color: 'blue' },
  { id: 'learning', label: 'Learning', color: 'amber' },
  { id: 'project',  label: 'Project',  color: 'green' },
  { id: 'personal', label: 'Personal', color: 'coffee' },
  { id: 'health',   label: 'Health',   color: 'red' },
]
