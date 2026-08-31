import { X } from 'lucide-react'
import { STATUSES, STATUS_LABEL, CATEGORIES } from '../../../data/mockTasksFull'
import './TasksFilters.css'

const PRIORITIES = [
  { id: 'high',   label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low',    label: 'Low' },
]

export default function TasksFilters({
  filterStatus, setFilterStatus,
  filterPriority, setFilterPriority,
  filterCategory, setFilterCategory,
  sortBy, setSortBy,
  hasActive, onClear,
}) {
  return (
    <div className="tf">
      <FilterGroup label="Status">
        <Chip active={filterStatus === 'all'} onClick={() => setFilterStatus('all')}>All</Chip>
        {STATUSES.map(s => (
          <Chip
            key={s}
            active={filterStatus === s}
            onClick={() => setFilterStatus(s)}
          >
            {STATUS_LABEL[s]}
          </Chip>
        ))}
      </FilterGroup>

      <div className="tf__divider" />

      <FilterGroup label="Priority">
        <Chip active={filterPriority === 'all'} onClick={() => setFilterPriority('all')}>All</Chip>
        {PRIORITIES.map(p => (
          <Chip
            key={p.id}
            active={filterPriority === p.id}
            onClick={() => setFilterPriority(p.id)}
            tone={p.id}
          >
            {p.label}
          </Chip>
        ))}
      </FilterGroup>

      <div className="tf__divider" />

      <FilterGroup label="Category">
        <Chip active={filterCategory === 'all'} onClick={() => setFilterCategory('all')}>All</Chip>
        {CATEGORIES.map(c => (
          <Chip
            key={c.id}
            active={filterCategory === c.id}
            onClick={() => setFilterCategory(c.id)}
          >
            {c.label}
          </Chip>
        ))}
      </FilterGroup>

      <div className="tf__right">
        <label className="tf__sort-label">Sort by</label>
        <select
          className="tf__sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
          <option value="created">Recently Added</option>
        </select>

        {hasActive && (
          <button className="tf__clear" onClick={onClear}>
            <X size={12} /> Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

function FilterGroup({ label, children }) {
  return (
    <div className="tf__group">
      <span className="tf__label">{label}</span>
      <div className="tf__chips">{children}</div>
    </div>
  )
}

function Chip({ active, onClick, children, tone }) {
  return (
    <button
      onClick={onClick}
      className={`tf__chip${active ? ` tf__chip--active tf__chip--${tone || 'default'}` : ''}`}
    >
      {children}
    </button>
  )
}
