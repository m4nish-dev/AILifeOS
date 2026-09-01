import './Skeleton.css'

export default function Skeleton({ variant = 'line', width, height, className = '', count = 1 }) {
  const elements = Array.from({ length: count })

  return (
    <>
      {elements.map((_, i) => (
        <div
          key={i}
          className={`skeleton skeleton--${variant} ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  )
}
