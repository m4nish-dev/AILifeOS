import { Plus, Sparkles, Search } from 'lucide-react'
import PageHeader from '../../common/PageHeader/PageHeader'
import './GoalsHeader.css'

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'active',    label: 'Active' },
  { id: 'on-track',  label: 'On track' },
  { id: 'at-risk',   label: 'At risk' },
  { id: 'completed', label: 'Completed' },
]

export default function GoalsHeader({ search, onSearch, onCreate, onAIGenerate, count, filter, onFilterChange, counts = {}, summary }) {
  return (
    <>
      <PageHeader
        title="Goals"
        subtitle={summary || `${count} goal${count !== 1 ? 's' : ''}`}
      >
        <label className="ui-search">
          <Search size={14} />
          <input placeholder="Search goals…" value={search} onChange={(e) => onSearch(e.target.value)} aria-label="Search goals" />
        </label>
        <button className="ui-btn ui-btn--dark" onClick={onAIGenerate}>
          <Sparkles size={14} />
          AI Roadmap
        </button>
        <button className="ui-btn ui-btn--primary" onClick={onCreate}>
          <Plus size={14} strokeWidth={2.4} />
          New Goal
        </button>
      </PageHeader>

      <div className="gh__bar">
        <div className="ui-tabs" role="tablist" aria-label="Filter goals">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`ui-tab${filter === f.id ? ' ui-tab--active' : ''}`}
              onClick={() => onFilterChange(f.id)}
            >
              {f.label}
              <span className="ui-count">{counts[f.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
