import './PageHeader.css'

/**
 * Page header shared by every app page: orange-barred eyebrow, serif title,
 * one-line subtitle, and a row of actions aligned to the title's baseline.
 */
export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="ph">
      <div className="ph__intro">
        {eyebrow && <div className="ph__eyebrow">{eyebrow}</div>}
        <h1 className="ph__title">{title}</h1>
        {subtitle && <p className="ph__sub">{subtitle}</p>}
      </div>
      {children && <div className="ph__actions">{children}</div>}
    </header>
  )
}
