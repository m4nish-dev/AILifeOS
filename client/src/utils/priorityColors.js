export function priorityColor(priority) {
  switch (priority) {
    case 'high':   return { bg: 'var(--red-50)',   fg: 'var(--red-600)',   dot: 'var(--red-600)' }
    case 'medium': return { bg: 'var(--amber-50)', fg: 'var(--amber-600)', dot: 'var(--amber-500)' }
    case 'low':    return { bg: 'var(--green-50)', fg: 'var(--green-700)', dot: 'var(--green-600)' }
    default:       return { bg: 'var(--bg-hover)', fg: 'var(--text-secondary)', dot: 'var(--text-tertiary)' }
  }
}
