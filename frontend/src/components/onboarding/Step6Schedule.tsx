import { Sun, Clock, Zap } from 'lucide-react'

interface Props {
  digestType: 'daily' | 'custom'
  digestTime: string
  onTypeChange: (t: 'daily' | 'custom') => void
  onTimeChange: (t: string) => void
}

const QUICK_TIMES = [
  { label: 'Early Bird', time: '07:00', desc: '7:00 AM'  },
  { label: 'Morning',    time: '09:00', desc: '9:00 AM'  },
  { label: 'Noon',       time: '12:00', desc: '12:00 PM' },
  { label: 'Evening',    time: '18:00', desc: '6:00 PM'  },
]

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

function formatTime(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function Step6Schedule({ digestType, digestTime, onTypeChange, onTimeChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', ...mono }}>

      {/* Type selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#1e1e1e' }}>
        {[
          { key: 'daily'  as const, label: 'Daily Digest',  desc: 'Every morning at your chosen time', icon: Sun   },
          { key: 'custom' as const, label: 'Custom Time',   desc: 'Pick your exact preferred time',    icon: Clock },
        ].map(({ key, label, desc, icon: Icon }) => {
          const active = digestType === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTypeChange(key)}
              style={{
                padding: '20px', cursor: 'pointer', textAlign: 'left',
                background: active ? 'rgba(0,212,255,0.06)' : '#0a0a0a',
                border: 'none',
                borderLeft: `2px solid ${active ? '#00d4ff' : 'transparent'}`,
                transition: 'background 0.1s, border-color 0.1s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#0d0d0d' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#0a0a0a' }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  width: '14px', height: '14px', background: '#00d4ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div style={{
                width: '36px', height: '36px',
                background: active ? 'rgba(0,212,255,0.1)' : '#111',
                border: `1px solid ${active ? 'rgba(0,212,255,0.3)' : '#1e1e1e'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '12px', transition: 'all 0.1s',
              }}>
                <Icon size={16} color={active ? '#00d4ff' : '#555'} />
              </div>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: active ? '#e0e0e0' : '#888', marginBottom: '4px' }}>{label}</h3>
              <p style={{ fontSize: '11px', color: '#555' }}>{desc}</p>
            </button>
          )
        })}
      </div>

      {/* Quick presets */}
      <div>
        <p style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>
          // quick_presets
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#1e1e1e' }}>
          {QUICK_TIMES.map(({ label, time, desc }) => {
            const active = digestTime === time
            return (
              <button
                key={time}
                type="button"
                onClick={() => onTimeChange(time)}
                style={{
                  padding: '12px 8px', cursor: 'pointer', textAlign: 'center',
                  background: active ? 'rgba(0,212,255,0.06)' : '#0a0a0a',
                  border: 'none',
                  borderTop: `2px solid ${active ? '#00d4ff' : 'transparent'}`,
                  transition: 'background 0.1s, border-color 0.1s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#0d0d0d' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#0a0a0a' }}
              >
                <p style={{ fontSize: '11px', fontWeight: 700, color: active ? '#00d4ff' : '#888', marginBottom: '3px' }}>{label}</p>
                <p style={{ fontSize: '10px', color: '#555' }}>{desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom time picker */}
      {digestType === 'custom' && (
        <div>
          <label style={{ fontSize: '10px', color: '#888', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            // set_exact_time
          </label>
          <div style={{ position: 'relative' }}>
            <Clock size={14} color="#555" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="time"
              value={digestTime}
              onChange={e => onTimeChange(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                background: '#0a0a0a', border: '1px solid #1e1e1e',
                color: '#e0e0e0', fontSize: '13px', outline: 'none',
                colorScheme: 'dark', ...mono,
                transition: 'border-color 0.1s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#00d4ff')}
              onBlur={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
            />
          </div>
        </div>
      )}

      {/* Summary */}
      {digestTime && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 14px',
          background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)',
        }}>
          <Zap size={13} color="#00d4ff" />
          <p style={{ fontSize: '12px', color: '#888' }}>
            Your digest arrives every day at{' '}
            <span style={{ color: '#00d4ff', fontWeight: 700 }}>{formatTime(digestTime)}</span>
          </p>
        </div>
      )}
    </div>
  )
}