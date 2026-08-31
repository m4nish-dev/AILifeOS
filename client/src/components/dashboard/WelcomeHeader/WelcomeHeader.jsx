import { Calendar } from 'lucide-react'
import { formatDate, greetingByHour } from '../../../utils/formatDate'
import './WelcomeHeader.css'

export default function WelcomeHeader({ name = 'Manish' }) {
  return (
    <div className="welcome">
      <div className="welcome__text">
        <h1 className="welcome__title">
          {greetingByHour()}, <span className="welcome__name">{name}</span>
          <span className="welcome__wave" role="img" aria-label="wave">👋</span>
        </h1>
        <p className="welcome__sub">Here's what matters today.</p>
      </div>
      <div className="welcome__date">
        <Calendar size={15} />
        <span>{formatDate()}</span>
      </div>
    </div>
  )
}
