import { Plus, LayoutGrid, List, Search } from 'lucide-react'
import './TasksHeader.css'

export default function TasksHeader({
  view, onViewChange,
  search, onSearchChange,
  onCreate,
  totalCount,
  summary,
}) {
  return (
    <header className="th">
      <div className="th__intro">
        <h1 className="th__title">Tasks</h1>
        <p className="th__sub">
          {summary || `${totalCount} task${totalCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="th__actions">
        <label className="th__search">
          <Search size={14} />
          <input
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search tasks"
          />
        </label>

        <div className="th__view" role="group" aria-label="View">
          <button
            className={`th__view-btn${view === 'list' ? ' th__view-btn--active' : ''}`}
            onClick={() => onViewChange('list')}
            aria-pressed={view === 'list'}
          >
            <List size={14} />
            <span>List</span>
          </button>
          <button
            className={`th__view-btn${view === 'kanban' ? ' th__view-btn--active' : ''}`}
            onClick={() => onViewChange('kanban')}
            aria-pressed={view === 'kanban'}
          >
            <LayoutGrid size={14} />
            <span>Kanban</span>
          </button>
        </div>

        <button className="th__create" onClick={onCreate}>
          <Plus size={14} strokeWidth={2.4} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  )
}
