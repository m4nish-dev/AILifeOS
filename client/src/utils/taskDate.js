const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatShortDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const now = new Date(); now.setHours(0,0,0,0)
  const then = new Date(dateStr); then.setHours(0,0,0,0)
  return Math.round((then - now) / (1000 * 60 * 60 * 24))
}

export function dueLabel(dateStr) {
  const d = daysUntil(dateStr)
  if (d === null) return ''
  if (d < 0)  return `Overdue ${Math.abs(d)}d`
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  if (d < 7)   return `In ${d} days`
  return formatShortDate(dateStr)
}

export function dueTone(dateStr, status) {
  if (status === 'done') return 'muted'
  const d = daysUntil(dateStr)
  if (d === null) return 'muted'
  if (d < 0)  return 'danger'
  if (d === 0) return 'warn'
  if (d <= 2) return 'warn'
  return 'muted'
}
