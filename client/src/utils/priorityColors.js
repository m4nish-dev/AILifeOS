// Priority identity, shared by the dashboard, task list and kanban.
// Colours come from the --priority-* tokens; the label is always shown too.
export function priorityColor(priority) {
  switch (priority) {
    case 'high':   return { bg: 'var(--red-50)',     fg: 'var(--priority-high)', dot: 'var(--priority-high)' }
    case 'medium': return { bg: 'var(--accent-soft)', fg: 'var(--accent-hover)', dot: 'var(--priority-medium)' }
    case 'low':    return { bg: 'var(--bg-hover)',    fg: 'var(--text-secondary)', dot: 'var(--priority-low)' }
    default:       return { bg: 'var(--bg-hover)',    fg: 'var(--text-secondary)', dot: 'var(--text-tertiary)' }
  }
}
