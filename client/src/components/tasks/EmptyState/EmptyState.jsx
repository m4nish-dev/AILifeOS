import { Inbox, Plus } from 'lucide-react'
import './EmptyState.css'

export default function EmptyState({ onCreate, hasFilters, onClear }) {
  return (
    <div className="es">
      <div className="es__icon"><Inbox size={32} strokeWidth={1.6} /></div>
      <h3 className="es__title">
        {hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
      </h3>
      <p className="es__sub">
        {hasFilters
          ? 'Try changing or clearing your filters to see more tasks.'
          : 'Create your first task to start organizing your day.'}
      </p>
      <div className="es__actions">
        {hasFilters && (
          <button className="es__btn es__btn--ghost" onClick={onClear}>
            Clear filters
          </button>
        )}
        <button className="es__btn es__btn--primary" onClick={onCreate}>
          <Plus size={14} strokeWidth={2.5} />
          Create task
        </button>
      </div>
    </div>
  )
}
