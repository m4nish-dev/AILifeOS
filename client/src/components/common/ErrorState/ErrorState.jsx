import { AlertTriangle, RefreshCcw } from 'lucide-react'
import './ErrorState.css'

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="error-state">
      <div className="error-state__box">
        <div className="error-state__icon">
          <AlertTriangle size={32} color="var(--red-500)" />
        </div>
        <h2>Something went wrong</h2>
        <p className="error-state__desc">
          An unexpected error occurred. Our team has been notified.
        </p>
        
        {error && (
          <div className="error-state__details">
            <code>{error.message || String(error)}</code>
          </div>
        )}

        <button className="error-state__btn" onClick={onRetry}>
          <RefreshCcw size={16} /> Try Again
        </button>
      </div>
    </div>
  )
}
