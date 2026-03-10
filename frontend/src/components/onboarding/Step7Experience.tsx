import { useState, useEffect } from 'react'
import { TrendingUp, Zap, Star, Crown, GraduationCap } from 'lucide-react'

const LEVELS = [
  { min: 0,  max: 0,  label: 'Fresher',   desc: 'Entry-level, internships & graduate roles',     icon: GraduationCap, color: '#ff6b9d', tip: "Entry-level, fresher & graduate jobs filtered for 0–1yr roles."         },
  { min: 1,  max: 2,  label: 'Junior',    desc: 'Junior roles, early career positions',           icon: TrendingUp,    color: '#ff9d4d', tip: "Junior roles matched, senior/lead excluded."                            },
  { min: 3,  max: 5,  label: 'Mid-level', desc: 'Mid-level & individual contributor roles',       icon: Zap,           color: '#00d4ff', tip: "Mid-level positions suited to your experience."                         },
  { min: 6,  max: 10, label: 'Senior',    desc: 'Senior, lead & specialist positions',            icon: Star,          color: '#00d4ff', tip: "Senior and lead roles prioritised in your digest."                      },
  { min: 11, max: 99, label: 'Expert',    desc: 'Principal, staff & architect-level roles',       icon: Crown,         color: '#ffd700', tip: "Expert, principal and architect roles matched for you."                 },
]

function deriveLevel(years: number) {
  return LEVELS.find(l => years >= l.min && years <= l.max) ?? LEVELS[0]
}

interface Props { value: number; onChange: (years: number) => void }

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function Step7Experience({ value, onChange }: Props) {
  const [raw, setRaw] = useState<string>(value === 0 ? '' : String(value))

  useEffect(() => { setRaw(value === 0 ? '' : String(value)) }, [])

  const years = raw === '' ? 0 : Math.max(0, Math.min(50, parseInt(raw, 10) || 0))
  const level = deriveLevel(years)
  const Icon  = level.icon

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 2)
    setRaw(cleaned)
    const parsed = cleaned === '' ? 0 : Math.max(0, Math.min(50, parseInt(cleaned, 10) || 0))
    onChange(parsed)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', ...mono }}>

      {/* Input */}
      <div>
        <label style={{ fontSize: '10px', color: '#888', letterSpacing: '0.16em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
          Years of experience
        </label>
        <p style={{ fontSize: '11px', color: '#555', marginBottom: '12px', lineHeight: 1.6 }}>
          Enter a number. Type <span style={{ color: '#e0e0e0' }}>0</span> if you are a fresher or just graduated.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={raw}
            onChange={handleChange}
            maxLength={2}
            style={{
              width: '64px', padding: '12px 0', textAlign: 'center',
              fontSize: '24px', fontWeight: 700,
              background: '#0a0a0a',
              border: `2px solid ${level.color}`,
              color: level.color, outline: 'none',
              transition: 'border-color 0.2s, color 0.2s', ...mono,
            }}
          />
          <span style={{ fontSize: '12px', color: '#888' }}>
            year{years !== 1 ? 's' : ''} of experience
          </span>
        </div>
      </div>

      {/* Live level card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        background: `${level.color}08`,
        border: `1px solid ${level.color}30`,
        transition: 'all 0.2s',
      }}>
        <div style={{
          width: '40px', height: '40px', flexShrink: 0,
          background: `${level.color}10`,
          border: `1px solid ${level.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <Icon size={18} color={level.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              padding: '2px 10px', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              background: `${level.color}15`, border: `1px solid ${level.color}30`,
              color: level.color,
            }}>
              {level.label}
            </span>
            {years === 0 && (
              <span style={{
                padding: '2px 10px', fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)',
                color: '#00ff88',
              }}>
                Fresher
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6 }}>{level.tip}</p>
        </div>
      </div>

      {/* Quick chips */}
      <div>
        <p style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>
          // quick_select
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[0, 1, 2, 3, 5, 7, 10].map(yr => {
            const active = years === yr
            return (
              <button key={yr} onClick={() => { setRaw(yr === 0 ? '' : String(yr)); onChange(yr) }}
                style={{
                  padding: '5px 14px', fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? `${level.color}12` : 'transparent',
                  border: `1px solid ${active ? level.color : '#1e1e1e'}`,
                  color: active ? level.color : '#555',
                  transition: 'all 0.1s', ...mono,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff' }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}}
              >
                {yr === 0 ? 'Fresher' : `${yr}yr`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '12px 14px',
        background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)',
      }}>
        <span style={{ fontSize: '11px', color: '#00d4ff', marginTop: '1px' }}>✦</span>
        <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.7 }}>
          This sets your experience level and controls which jobs appear in your digest.
          You can update it anytime from your dashboard.
        </p>
      </div>
    </div>
  )
}