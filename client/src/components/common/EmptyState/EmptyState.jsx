import './EmptyState.css'

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state__icon-wrapper">
          <Icon size={32} className="empty-state__icon" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      
      {actionLabel && onAction && (
        <button className="empty-state__btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
