import { Plus, Sparkles, Search } from 'lucide-react'
import './GoalsHeader.css'

export default function GoalsHeader({ search, onSearch, onCreate, onAIGenerate, count, filter, onFilterChange }) {
  return (
    <div className="gh">
      <div className="gh__top">
        <div>
          <h1 className="gh__title">Goals</h1>
          <p className="gh__sub">{count} active goals · Turn intentions into outcomes.</p>
        </div>
        <div className="gh__actions">
          <div className="gh__search">
            <Search size={15} />
            <input placeholder="Search goals…" value={search} onChange={(e) => onSearch(e.target.value)} />
          </div>
          <button className="gh__ai" onClick={onAIGenerate}>
            <Sparkles size={14} strokeWidth={2.4} />
            <span>AI Roadmap</span>
          </button>
          <button className="gh__create" onClick={onCreate}>
            <Plus size={15} strokeWidth={2.5} />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      <div className="gh__tabs">
        {['all', 'active', 'on-track', 'at-risk', 'completed'].map((f) => (
          <button
            key={f}
            className={`gh__tab${filter === f ? ' gh__tab--active' : ''}`}
            onClick={() => onFilterChange(f)}
          >
            {f === 'all' ? 'All Goals' : f.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>
    </div>
  )
}
