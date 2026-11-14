import { X, ChevronDown } from 'lucide-react'
import { STATUSES, STATUS_LABEL, CATEGORIES } from '../../../data/mockTasksFull'
import './TasksFilters.css'

const PRIORITIES = [
  { id: 'high',   label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low',    label: 'Low' },
]

const SORTS = [
  { id: 'dueDate',  label: 'Due date' },
  { id: 'priority', label: 'Priority' },
  { id: 'title',    label: 'Title' },
  { id: 'created',  label: 'Recently added' },
]

/**
 * Toolbar at the top of the task panel: status as underline tabs (with
 * counts), and priority / category / sort as compact dropdowns.
 */
export default function TasksFilters({
  filterStatus, setFilterStatus,
  filterPriority, setFilterPriority,
  filterCategory, setFilterCategory,
  sortBy, setSortBy,
  hasActive, onClear,
  statusCounts = {},
}) {
  const tabs = [{ id: 'all', label: 'All' }, ...STATUSES.map(s => ({ id: s, label: STATUS_LABEL[s] }))]

  return (
    <div className="tf">
      <div className="tf__tabs" role="tablist" aria-label="Filter by status">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={filterStatus === t.id}
            className={`tf__tab${filterStatus === t.id ? ' tf__tab--active' : ''}`}
            onClick={() => setFilterStatus(t.id)}
          >
            {t.label}
            <span className="tf__count">{statusCounts[t.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="tf__tools">
        <Select label="Priority" value={filterPriority} onChange={setFilterPriority}
          options={[{ id: 'all', label: 'All' }, ...PRIORITIES]} />
        <Select label="Category" value={filterCategory} onChange={setFilterCategory}
          options={[{ id: 'all', label: 'All' }, ...CATEGORIES]} />
        <Select label="Sort" value={sortBy} onChange={setSortBy} options={SORTS} />

        {hasActive && (
          <button className="tf__clear" onClick={onClear}>
            <X size={12} /> Clear
          </button>
        )}
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  const active = value !== 'all' && label !== 'Sort'
  return (
    <label className={`tf__select${active ? ' tf__select--active' : ''}`}>
      <span className="tf__select-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="tf__select-caret" />
    </label>
  )
}
