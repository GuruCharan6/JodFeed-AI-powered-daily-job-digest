import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

const mono = "'JetBrains Mono', monospace"

const SIZE_PADDING: Record<string, string> = {
  sm: '6px 14px',
  md: '8px 20px',
  lg: '11px 28px',
  xl: '14px 36px',
}
const SIZE_FONT: Record<string, string> = {
  sm: '10px',
  md: '11px',
  lg: '11px',
  xl: '12px',
}

export default function Button({
  children,
  variant = 'primary',
  isLoading,
  size = 'md',
  fullWidth,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    fontFamily: mono,
    fontSize: SIZE_FONT[size],
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: SIZE_PADDING[size],
    border: 'none',
    borderRadius: 0,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : undefined,
    transition: 'background 0.1s, box-shadow 0.1s, color 0.1s, border-color 0.1s',
    whiteSpace: 'nowrap',
    opacity: disabled && !isLoading ? 0.35 : 1,
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: '#00d4ff',
      color: '#000',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: '#888',
      border: '1px solid #1e1e1e',
    },
    ghost: {
      background: 'transparent',
      color: '#555',
      border: 'none',
      letterSpacing: '0.1em',
    },
    danger: {
      background: 'rgba(255,68,68,0.08)',
      color: '#ff4444',
      border: '1px solid rgba(255,68,68,0.25)',
    },
  }

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary:   { background: '#fff', boxShadow: '0 0 16px rgba(0,212,255,0.25)' },
    secondary: { borderColor: '#00d4ff', color: '#00d4ff', background: 'rgba(0,212,255,0.06)' },
    ghost:     { color: '#00d4ff', background: 'rgba(0,212,255,0.06)' },
    danger:    { background: 'rgba(255,68,68,0.14)', borderColor: 'rgba(255,68,68,0.45)' },
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return
    Object.assign(e.currentTarget.style, hoverStyles[variant])
  }
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return
    // Reset to base variant styles
    const v = variants[variant]
    e.currentTarget.style.background = (v.background as string) || 'transparent'
    e.currentTarget.style.color = v.color as string
    e.currentTarget.style.borderColor = ''
    e.currentTarget.style.boxShadow = ''
  }

  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      disabled={disabled || isLoading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isLoading ? (
        <>
          {/* Square spinner */}
          <svg
            style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
            width="13" height="13" viewBox="0 0 24 24" fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="square"/>
          </svg>
          <span>Processing…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      ) : children}
    </button>
  )
}