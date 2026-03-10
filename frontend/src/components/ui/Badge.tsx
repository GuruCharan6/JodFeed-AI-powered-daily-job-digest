import { X } from 'lucide-react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'violet' | 'green' | 'orange' | 'default'
  onRemove?: () => void
  className?: string
}

const mono = "'JetBrains Mono', monospace"

// All variants use the same base — cyan — just aliased for drop-in compat
const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  blue: {
    background: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.25)',
    color: '#00d4ff',
  },
  violet: {
    background: 'rgba(0,212,255,0.06)',
    border: '1px solid rgba(0,212,255,0.2)',
    color: '#00d4ff',
  },
  green: {
    background: 'rgba(0,255,136,0.07)',
    border: '1px solid rgba(0,255,136,0.22)',
    color: '#00ff88',
  },
  orange: {
    background: 'rgba(255,157,77,0.08)',
    border: '1px solid rgba(255,157,77,0.25)',
    color: '#ff9d4d',
  },
  default: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #1e1e1e',
    color: '#888',
  },
}

export default function Badge({ children, variant = 'blue', onRemove, className = '' }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 9px',
        fontFamily: mono,
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.04em',
        borderRadius: 0,
        ...VARIANT_STYLES[variant],
      }}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: '#555',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            marginLeft: '2px',
            transition: 'color 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >
          <X size={11} strokeWidth={3} />
        </button>
      )}
    </span>
  )
}