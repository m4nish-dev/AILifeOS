import { Plus, LayoutGrid, List, Search } from 'lucide-react'
import './TasksHeader.css'

export default function TasksHeader({
  view, onViewChange,
  search, onSearchChange,
  onCreate,
  totalCount,
}) {
  return (
    <div className="th">
      <div className="th__top">
        <div className="th__title-block">
          <h1 className="th__title">Tasks</h1>
          <p className="th__sub">
            {totalCount} task{totalCount !== 1 ? 's' : ''} · Stay on top of what matters.
          </p>
        </div>

        <div className="th__actions">
          <div className="th__search">
            <Search size={15} />
            <input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="th__view">
            <button
              className={`th__view-btn${view === 'list' ? ' th__view-btn--active' : ''}`}
              onClick={() => onViewChange('list')}
              aria-label="List view"
            >
              <List size={15} strokeWidth={2.2} />
              <span>List</span>
            </button>
            <button
              className={`th__view-btn${view === 'kanban' ? ' th__view-btn--active' : ''}`}
              onClick={() => onViewChange('kanban')}
              aria-label="Kanban view"
            >
              <LayoutGrid size={15} strokeWidth={2.2} />
              <span>Kanban</span>
            </button>
          </div>

          <button className="th__create" onClick={onCreate}>
            <Plus size={15} strokeWidth={2.5} />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </div>
  )
}
