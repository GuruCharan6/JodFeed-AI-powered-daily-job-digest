import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  rightEl?: React.ReactNode
}

const mono = "'JetBrains Mono', monospace"

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightEl, className = '', style, ...props }, ref) => (
    <div style={{ width: '100%', fontFamily: mono }}>

      {label && (
        <label style={{
          display: 'block',
          fontFamily: mono,
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#888',
          marginBottom: '6px',
        }}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {/* Left icon */}
        {icon && (
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#555',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}>
            {icon}
          </span>
        )}

        <input
          ref={ref}
          style={{
            width: '100%',
            fontFamily: mono,
            fontSize: '12px',
            fontWeight: 400,
            color: '#e0e0e0',
            background: '#0a0a0a',
            border: `1px solid ${error ? '#ff4444' : '#1e1e1e'}`,
            borderRadius: 0,
            outline: 'none',
            padding: `10px ${rightEl ? '40px' : '14px'} 10px ${icon ? '38px' : '14px'}`,
            transition: 'border-color 0.1s, box-shadow 0.1s',
            ...style,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = error ? '#ff4444' : '#00d4ff'
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 1px #ff4444'
              : '0 0 0 1px #00d4ff'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error ? '#ff4444' : '#1e1e1e'
            e.currentTarget.style.boxShadow = 'none'
          }}
          {...props}
        />

        {/* Right element */}
        {rightEl && (
          <span style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
          }}>
            {rightEl}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{
          marginTop: '5px',
          fontSize: '10px',
          fontWeight: 600,
          color: '#ff4444',
          letterSpacing: '0.06em',
          fontFamily: mono,
        }}>
          {error}
        </p>
      )}

      {/* Hint */}
      {hint && !error && (
        <p style={{
          marginTop: '5px',
          fontSize: '10px',
          color: '#555',
          fontFamily: mono,
        }}>
          {hint}
        </p>
      )}
    </div>
  )
)

Input.displayName = 'Input'
export default Input