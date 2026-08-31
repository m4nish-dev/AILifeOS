export function categoryColor(category) {
  switch (category) {
    case 'development': return { bg: 'var(--green-50)',  fg: 'var(--green-700)',  dot: 'var(--green-600)' }
    case 'dsa':         return { bg: 'var(--amber-50)',  fg: 'var(--amber-600)',  dot: 'var(--amber-500)' }
    case 'learning':    return { bg: 'var(--coffee-50)', fg: 'var(--coffee-700)', dot: 'var(--coffee-600)' }
    case 'work':        return { bg: 'var(--blue-50)',   fg: 'var(--blue-600)',   dot: 'var(--blue-500)' }
    case 'personal':    return { bg: 'var(--red-50)',    fg: 'var(--red-600)',    dot: 'var(--red-600)' }
    default:            return { bg: 'var(--bg-hover)',  fg: 'var(--text-secondary)', dot: 'var(--text-tertiary)' }
  }
}

export function statusColor(status) {
  switch (status) {
    case 'todo':        return { bg: 'var(--bg-hover)',   fg: 'var(--text-secondary)', dot: 'var(--text-tertiary)' }
    case 'in-progress': return { bg: 'var(--blue-50)',    fg: 'var(--blue-600)',       dot: 'var(--blue-500)' }
    case 'review':      return { bg: 'var(--coffee-50)',  fg: 'var(--coffee-700)',     dot: 'var(--coffee-600)' }
    case 'done':        return { bg: 'var(--green-50)',   fg: 'var(--green-700)',      dot: 'var(--green-600)' }
    default:            return { bg: 'var(--bg-hover)',   fg: 'var(--text-secondary)', dot: 'var(--text-tertiary)' }
  }
}
