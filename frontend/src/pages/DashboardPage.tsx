import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getProfile, saveProfile } from '../api/profile'
import { useAuthStore } from '../store/authstore'
import { showToast } from '../components/ui/Toast'
import {
  Mail, MapPin, Clock, Edit2, X,
  Wifi, Plus, Zap, Sparkles,
  Activity, Target, Globe, Building2,
} from 'lucide-react'

// Hide number input spinners globally for this page
const hideSpinnersStyle = `
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; appearance: textfield; }
`

// ── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  full_name:           string
  email:               string
  skills:              string[]
  target_roles:        string[]
  locations:           string[]
  location:            string
  remote:              boolean
  company_pref:        string[]
  years_of_experience: number
  is_fresher:          boolean
  experience_level:    string
  digest_enabled:      boolean
  digest_time:         string
  digest_type:         string
  onboarding_complete: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COMPANY_OPTIONS = [
  { id: 'mnc',     label: 'MNC / Enterprise' },
  { id: 'startup', label: 'Startups'          },
  { id: 'remote',  label: 'Remote-first'      },
  { id: 'govt',    label: 'Government / PSU'  },
  { id: 'ngo',     label: 'NGO / Non-profit'  },
]

function deriveLevel(years: number) {
  if (years === 0)  return { label: 'Fresher',   color: '#ff6b9d', hint: 'Entry-level & fresher jobs only'    }
  if (years <= 2)   return { label: 'Junior',    color: '#ff9d4d', hint: 'Junior roles, 0–2 years experience' }
  if (years <= 5)   return { label: 'Mid-level', color: '#00d4ff', hint: 'Mid-level positions matched'        }
  if (years <= 10)  return { label: 'Senior',    color: '#00d4ff', hint: 'Senior & lead roles in your digest' }
  return              { label: 'Expert',    color: '#ffd700', hint: 'Principal & expert-level positions'  }
}

function formatTime(t: string) {
  if (!t) return '9:00 AM'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

// ── Digest Toggle ─────────────────────────────────────────────────────────────

function DigestToggle({ enabled, saving, onToggle }: {
  enabled: boolean
  saving: boolean
  onToggle: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onToggle}
      disabled={saving}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={enabled ? 'Pause digest' : 'Activate digest'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 14px 8px 10px',
        background: enabled
          ? 'rgba(0,212,255,0.07)'
          : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: `1px solid ${enabled ? 'rgba(0,212,255,0.3)' : hovered ? '#333' : '#222'}`,
        cursor: saving ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: saving ? 0.6 : 1,
        ...mono,
      }}
    >
      {/* Track */}
      <div style={{
        position: 'relative',
        width: '36px',
        height: '20px',
        background: enabled ? '#00d4ff' : '#1a1a1a',
        border: `1px solid ${enabled ? '#00d4ff' : '#333'}`,
        borderRadius: '10px',
        transition: 'all 0.25s',
        flexShrink: 0,
      }}>
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          top: '2px',
          left: enabled ? '17px' : '2px',
          width: '14px',
          height: '14px',
          background: enabled ? '#000' : '#555',
          borderRadius: '50%',
          transition: 'left 0.25s, background 0.25s',
          boxShadow: enabled ? '0 0 8px rgba(0,212,255,0.7)' : 'none',
        }} />
      </div>

      <span style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: enabled ? '#00d4ff' : '#555',
        transition: 'color 0.2s',
        minWidth: '42px',
      }}>
        {saving ? '...' : enabled ? 'Active' : 'Paused'}
      </span>
    </button>
  )
}

// ── Shared Modal Shell ────────────────────────────────────────────────────────

function ModalShell({ title, prefix, children, onClose, onSave }: {
  title: string; prefix: string
  children: React.ReactNode
  onClose: () => void; onSave: () => void
}) {
  // Lock body scroll and always center in viewport regardless of scroll position
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '16px', backdropFilter: 'blur(4px)',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#111', border: '1px solid #1e1e1e',
        borderTop: '2px solid #00d4ff',
        width: '100%', maxWidth: '440px',
        padding: '24px', ...mono,
      }} className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {prefix}
            </div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{title}</h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #1e1e1e', color: '#555',
            padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            transition: 'border-color 0.1s, color 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ marginBottom: '20px' }}>{children}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', background: 'transparent',
            border: '1px solid #1e1e1e', color: '#888', cursor: 'pointer',
            fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', ...mono,
            transition: 'border-color 0.1s, color 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#e0e0e0' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#888' }}
          >
            Cancel
          </button>
          <button onClick={onSave} style={{
            flex: 1, padding: '10px', background: '#00d4ff',
            border: 'none', color: '#000', cursor: 'pointer',
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', ...mono,
            transition: 'background 0.1s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#00d4ff')}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Tag Input ─────────────────────────────────────────────────────────────────

function TagInput({ items, onAdd, onRemove, placeholder }: {
  items: string[]; onAdd: (v: string) => void
  onRemove: (v: string) => void; placeholder: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !items.includes(v)) { onAdd(v); setInput('') }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex' }}>
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder}
          style={{
            flex: 1, padding: '9px 12px', background: '#0a0a0a',
            border: '1px solid #1e1e1e', borderRight: 'none',
            color: '#e0e0e0', fontSize: '12px', outline: 'none', ...mono,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#00d4ff')}
          onBlur={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
        />
        <button onClick={add} style={{
          padding: '9px 14px', background: '#00d4ff',
          border: 'none', color: '#000', cursor: 'pointer',
          display: 'flex', alignItems: 'center', transition: 'background 0.1s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.background = '#00d4ff')}
        >
          <Plus size={14} />
        </button>
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px',
        padding: '12px', background: '#0a0a0a',
        border: '1px solid #1e1e1e', minHeight: '64px',
      }}>
        {items.length === 0
          ? <span style={{ fontSize: '11px', color: '#333' }}>Nothing added yet</span>
          : items.map(item => (
            <span key={item} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px',
              background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
              color: '#00d4ff', fontSize: '11px', letterSpacing: '0.05em',
            }}>
              {item}
              <button onClick={() => onRemove(item)} style={{
                background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: 0,
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}
              >
                <X size={11} />
              </button>
            </span>
          ))}
      </div>
    </div>
  )
}

// ── Modals ────────────────────────────────────────────────────────────────────

function SkillsModal({ isOpen, skills, onSave, onClose }: { isOpen: boolean; skills: string[]; onSave: (v: string[]) => void; onClose: () => void }) {
  const [items, setItems] = useState(skills)
  useEffect(() => { if (isOpen) setItems(skills) }, [isOpen])
  if (!isOpen) return null
  return (
    <ModalShell title="Edit Skills" prefix="// skills" onClose={onClose} onSave={() => { onSave(items); onClose() }}>
      <TagInput items={items} onAdd={v => setItems(p => [...p, v])} onRemove={v => setItems(p => p.filter(x => x !== v))} placeholder="e.g. React, Python…" />
    </ModalShell>
  )
}

function RolesModal({ isOpen, roles, onSave, onClose }: { isOpen: boolean; roles: string[]; onSave: (v: string[]) => void; onClose: () => void }) {
  const [items, setItems] = useState(roles)
  useEffect(() => { if (isOpen) setItems(roles) }, [isOpen])
  if (!isOpen) return null
  return (
    <ModalShell title="Edit Target Roles" prefix="// target_roles" onClose={onClose} onSave={() => { onSave(items); onClose() }}>
      <TagInput items={items} onAdd={v => setItems(p => [...p, v])} onRemove={v => setItems(p => p.filter(x => x !== v))} placeholder="e.g. Frontend Engineer…" />
    </ModalShell>
  )
}

function LocationsModal({ isOpen, locations, remote, onSave, onClose }: {
  isOpen: boolean; locations: string[]; remote: boolean
  onSave: (locs: string[], remote: boolean) => void; onClose: () => void
}) {
  const [items, setItems] = useState(locations)
  const [rem, setRem] = useState(remote)
  useEffect(() => { if (isOpen) { setItems(locations); setRem(remote) } }, [isOpen])
  if (!isOpen) return null
  return (
    <ModalShell title="Edit Locations" prefix="// locations" onClose={onClose} onSave={() => { onSave(items, rem); onClose() }}>
      <TagInput items={items} onAdd={v => setItems(p => [...p, v])} onRemove={v => setItems(p => p.filter(x => x !== v))} placeholder="e.g. Bangalore, Mumbai…" />
      <label style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', background: rem ? 'rgba(0,212,255,0.06)' : '#0a0a0a',
        border: `1px solid ${rem ? 'rgba(0,212,255,0.3)' : '#1e1e1e'}`,
        cursor: 'pointer', marginTop: '8px',
      }}>
        <input type="checkbox" checked={rem} onChange={e => setRem(e.target.checked)}
          style={{ accentColor: '#00d4ff', cursor: 'pointer' }} />
        <Wifi size={13} color="#00d4ff" />
        <span style={{ fontSize: '12px', color: '#e0e0e0', ...mono }}>Open to Remote</span>
      </label>
    </ModalShell>
  )
}

function CompaniesModal({ isOpen, selected, onSave, onClose }: {
  isOpen: boolean; selected: string[]; onSave: (v: string[]) => void; onClose: () => void
}) {
  const [items, setItems] = useState(selected)
  useEffect(() => { if (isOpen) setItems(selected) }, [isOpen])
  if (!isOpen) return null
  const toggle = (id: string) => setItems(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  return (
    <ModalShell title="Company Preferences" prefix="// company_pref" onClose={onClose} onSave={() => { onSave(items); onClose() }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#1e1e1e' }}>
        {COMPANY_OPTIONS.map(opt => (
          <label key={opt.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', cursor: 'pointer',
            background: items.includes(opt.id) ? 'rgba(0,212,255,0.06)' : '#0a0a0a',
            transition: 'background 0.1s',
          }}>
            <input type="checkbox" checked={items.includes(opt.id)} onChange={() => toggle(opt.id)}
              style={{ accentColor: '#00d4ff', cursor: 'pointer' }} />
            <span style={{ fontSize: '12px', color: items.includes(opt.id) ? '#00d4ff' : '#888', flex: 1, ...mono }}>
              {opt.label}
            </span>
            {items.includes(opt.id) && (
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d4ff' }} className="animate-pulse-cyan" />
            )}
          </label>
        ))}
      </div>
    </ModalShell>
  )
}

function ExperienceModal({ isOpen, years, onSave, onClose }: {
  isOpen: boolean; years: number; onSave: (y: number) => void; onClose: () => void
}) {
  const [raw, setRaw] = useState(years === 0 ? '' : String(years))
  useEffect(() => { if (isOpen) setRaw(years === 0 ? '' : String(years)) }, [isOpen])
  if (!isOpen) return null
  const parsed = raw === '' ? 0 : Math.max(0, Math.min(50, parseInt(raw) || 0))
  const level = deriveLevel(parsed)
  return (
    <ModalShell title="Your Experience" prefix="// experience" onClose={onClose} onSave={() => { onSave(parsed); onClose() }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '10px', color: '#888', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Years of experience (0 = fresher)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*"
              placeholder="0" value={raw} maxLength={2}
              onChange={e => setRaw(e.target.value.replace(/\D/g, '').slice(0, 2))}
              style={{
                width: '64px', padding: '10px', textAlign: 'center',
                fontSize: '20px', fontWeight: 700, background: '#0a0a0a',
                border: `2px solid ${level.color}`, color: level.color, outline: 'none', ...mono,
              }}
            />
            <span style={{ fontSize: '12px', color: '#888' }}>years of experience</span>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', background: 'rgba(0,212,255,0.04)',
          border: `1px solid ${level.color}44`,
        }}>
          <span style={{
            padding: '3px 10px', fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            background: `${level.color}15`, border: `1px solid ${level.color}44`, color: level.color,
          }}>{level.label}</span>
          <p style={{ fontSize: '11px', color: '#888' }}>{level.hint}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[0, 1, 2, 3, 5, 7, 10].map(yr => (
            <button key={yr} onClick={() => setRaw(yr === 0 ? '' : String(yr))} style={{
              padding: '5px 12px', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.1em', cursor: 'pointer',
              background: parsed === yr ? `${level.color}15` : 'transparent',
              border: `1px solid ${parsed === yr ? level.color : '#1e1e1e'}`,
              color: parsed === yr ? level.color : '#555',
              transition: 'all 0.1s', ...mono,
            }}>
              {yr === 0 ? 'Fresher' : `${yr}yr`}
            </button>
          ))}
        </div>
      </div>
    </ModalShell>
  )
}

function DigestTimeModal({ isOpen, time, onSave, onClose }: {
  isOpen: boolean; time: string; onSave: (t: string) => void; onClose: () => void
}) {
  const parse = (t: string) => {
    const [h, m] = (t || '09:00').split(':').map(Number)
    return { hour: h % 12 || 12, minute: m, period: (h >= 12 ? 'PM' : 'AM') as 'AM' | 'PM' }
  }

  const [hourRaw, setHourRaw] = useState('')
  const [minRaw, setMinRaw] = useState('')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')

  useEffect(() => {
    if (isOpen) {
      const p = parse(time)
      setHourRaw(String(p.hour).padStart(2, '0'))
      setMinRaw(String(p.minute).padStart(2, '0'))
      setPeriod(p.period)
    }
  }, [isOpen])

  if (!isOpen) return null

  const toHHMM = () => {
    const h = Math.max(1, Math.min(12, parseInt(hourRaw) || 12))
    const m = Math.max(0, Math.min(59, parseInt(minRaw) || 0))
    const h24 = period === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12)
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const displayHour = parseInt(hourRaw) || 0
  const displayMin = parseInt(minRaw) || 0

  return (
    <ModalShell title="Edit Digest Time" prefix="// digest_time" onClose={onClose} onSave={() => { onSave(toHHMM()); onClose() }}>
      <style>{hideSpinnersStyle}</style>
      <p style={{ fontSize: '11px', color: '#555', marginBottom: '16px', letterSpacing: '0.04em' }}>
        What time should your daily digest arrive?
      </p>

      {/* Editable HH : MM  +  AM/PM */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)',
        marginBottom: '20px', gap: '4px',
      }}>
        {/* Hour */}
        <input
          type="text" inputMode="numeric" maxLength={2}
          value={hourRaw}
          onFocus={e => e.target.select()}
          onChange={e => setHourRaw(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => {
            const v = parseInt(hourRaw)
            const clamped = isNaN(v) || v < 1 ? 1 : v > 12 ? 12 : v
            setHourRaw(String(clamped).padStart(2, '0'))
          }}
          style={{
            width: '70px', background: 'transparent', border: 'none', outline: 'none',
            fontSize: '36px', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.05em',
            textAlign: 'center', caretColor: '#00d4ff', ...mono,
          }}
        />

        <span style={{ fontSize: '36px', fontWeight: 700, color: '#00d4ff', opacity: 0.4, lineHeight: 1, userSelect: 'none' }}>:</span>

        {/* Minute */}
        <input
          type="text" inputMode="numeric" maxLength={2}
          value={minRaw}
          onFocus={e => e.target.select()}
          onChange={e => setMinRaw(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={() => {
            const v = parseInt(minRaw)
            const clamped = isNaN(v) || v < 0 ? 0 : v > 59 ? 59 : v
            setMinRaw(String(clamped).padStart(2, '0'))
          }}
          style={{
            width: '70px', background: 'transparent', border: 'none', outline: 'none',
            fontSize: '36px', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.05em',
            textAlign: 'center', caretColor: '#00d4ff', ...mono,
          }}
        />

        {/* AM/PM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '8px' }}>
          {(['AM', 'PM'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.1em', cursor: 'pointer',
              background: period === p ? 'rgba(0,212,255,0.15)' : 'transparent',
              border: `1px solid ${period === p ? '#00d4ff' : '#333'}`,
              color: period === p ? '#00d4ff' : '#555',
              transition: 'all 0.1s', ...mono,
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Quick presets */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Quick select
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[
            { label: '8:00 AM',  h: 8,  m: 0,  p: 'AM' as const },
            { label: '9:00 AM',  h: 9,  m: 0,  p: 'AM' as const },
            { label: '12:00 PM', h: 12, m: 0,  p: 'PM' as const },
            { label: '3:00 PM',  h: 3,  m: 0,  p: 'PM' as const },
            { label: '6:00 PM',  h: 6,  m: 0,  p: 'PM' as const },
            { label: '9:00 PM',  h: 9,  m: 0,  p: 'PM' as const },
          ].map(preset => {
            const active = displayHour === preset.h && displayMin === preset.m && period === preset.p
            return (
              <button key={preset.label} onClick={() => {
                setHourRaw(String(preset.h).padStart(2, '0'))
                setMinRaw(String(preset.m).padStart(2, '0'))
                setPeriod(preset.p)
              }} style={{
                padding: '5px 12px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', letterSpacing: '0.04em',
                background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
                border: `1px solid ${active ? '#00d4ff' : '#1e1e1e'}`,
                color: active ? '#00d4ff' : '#555',
                transition: 'all 0.1s', ...mono,
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#ccc' }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>
    </ModalShell>
  )
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({ title, prefix, icon, onEdit, saving, children }: {
  title: string; prefix: string; icon?: React.ReactNode
  onEdit: () => void; saving: boolean; children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{
      background: '#111', border: '1px solid #1e1e1e',
      borderLeft: `2px solid ${hovered ? '#00d4ff' : '#1e1e1e'}`,
      padding: '20px', position: 'relative', transition: 'border-color 0.15s',
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          {/* // prefix row — icon sits right next to the // text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
            {icon && <span style={{ color: '#00d4ff', opacity: 0.7, display: 'flex', alignItems: 'center' }}>{icon}</span>}
            <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {prefix}
            </div>
          </div>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0' }}>{title}</h3>
        </div>
        <button
          onClick={onEdit} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px', background: 'transparent',
            border: '1px solid #1e1e1e', color: '#555', cursor: 'pointer',
            fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
            opacity: hovered ? 1 : 0, transition: 'opacity 0.15s, border-color 0.1s, color 0.1s', ...mono,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}
        >
          <Edit2 size={11} /> Edit
        </button>
      </div>
      {children}
    </div>
  )
}

// ── Tag Badge ─────────────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', fontSize: '11px',
      background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)',
      color: '#00d4ff', letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

type ModalKey = 'skills' | 'roles' | 'locations' | 'companies' | 'experience' | 'time'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingDigest, setTogglingDigest] = useState(false)
  const [openModal, setOpenModal] = useState<ModalKey | null>(null)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const { data } = await getProfile()
      setProfile(data)
    } catch {
      showToast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const save = async (updates: Partial<Profile>) => {
    if (!profile) return
    setSaving(true)
    let localUpdates = { ...updates }
    if ('years_of_experience' in updates) {
      const y = updates.years_of_experience ?? 0
      localUpdates = {
        ...localUpdates,
        is_fresher: y === 0,
        experience_level: y === 0 ? 'fresher' : y <= 2 ? 'junior' : y <= 5 ? 'mid' : y <= 10 ? 'senior' : 'expert',
      }
    }
    setProfile(prev => prev ? { ...prev, ...localUpdates } : null)
    try {
      await saveProfile(updates)
      showToast.success('Saved')
    } catch {
      setProfile(profile)
      showToast.error('Failed to save — changes reverted')
    } finally {
      setSaving(false)
    }
  }

  // ── Digest toggle — patches digest_enabled in Supabase via saveProfile ──
  const toggleDigest = async () => {
    if (!profile || togglingDigest) return
    const newValue = !profile.digest_enabled
    setTogglingDigest(true)
    // Optimistic update
    setProfile(prev => prev ? { ...prev, digest_enabled: newValue } : null)
    try {
      await saveProfile({ digest_enabled: newValue })
      showToast.success(newValue ? 'Digest activated' : 'Digest paused')
    } catch {
      // Revert on failure
      setProfile(prev => prev ? { ...prev, digest_enabled: !newValue } : null)
      showToast.error('Failed to update digest — try again')
    } finally {
      setTogglingDigest(false)
    }
  }

  const displayLocations = profile?.locations?.length
    ? profile.locations
    : profile?.location ? [profile.location] : []

  const expYears = profile?.years_of_experience ?? 0
  const expLevel = deriveLevel(expYears)
  const digestOn = profile?.digest_enabled ?? true

  // ── Loading ──
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: '16px', ...mono,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em' }}>// loading_profile</span>
          <span style={{ display: 'inline-block', width: '7px', height: '13px', background: '#00d4ff' }} className="animate-blink" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '64px', ...mono }} className="animate-fade-in">

      {/* ══════════════════════════════════════════════════════
          HEADER — Name · Email · Digest Toggle (replaces Refresh)
          ══════════════════════════════════════════════════════ */}
      <div style={{
        background: '#111',
        border: '1px solid #1e1e1e',
        borderTop: '2px solid #00d4ff',
        padding: '24px 28px',
        marginBottom: '1px',
      }}>
        {/* Row 1: identity + toggle */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
              {profile.full_name ? profile.full_name.split(' ')[0] : 'Dashboard'}
            </h1>
            <p style={{ fontSize: '11px', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={11} color="#555" /> {user?.email}
            </p>
          </div>

          {/* Digest toggle — RIGHT SIDE, replaces old Refresh button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <div style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              // digest
            </div>
            <DigestToggle
              enabled={digestOn}
              saving={togglingDigest}
              onToggle={toggleDigest}
            />
          </div>
        </div>

        {/* Row 2: digest status banner */}
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          background: digestOn ? 'rgba(0,212,255,0.04)' : 'rgba(255,255,255,0.015)',
          border: `1px solid ${digestOn ? 'rgba(0,212,255,0.15)' : '#1e1e1e'}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
          transition: 'all 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live dot */}
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: digestOn ? '#00ff88' : '#2a2a2a',
              boxShadow: digestOn ? '0 0 8px rgba(0,255,136,0.5)' : 'none',
              transition: 'all 0.3s', flexShrink: 0,
            }} className={digestOn ? 'animate-pulse-cyan' : ''} />
            <div>
              <div style={{
                fontSize: '12px', fontWeight: 600,
                color: digestOn ? '#e0e0e0' : '#444',
                marginBottom: '2px',
              }}>
                {digestOn ? 'Daily digest is running' : 'Digest paused — no emails will be sent'}
              </div>
              <div style={{ fontSize: '10px', color: '#555' }}>
                {digestOn
                  ? <>Delivers at <span style={{ color: '#00d4ff' }}>{formatTime(profile.digest_time)}</span> · top matched jobs daily</>
                  : 'Toggle on above to resume your job feed'
                }
              </div>
            </div>
          </div>

          {/* Edit Time — only shown when digest is active */}
          {digestOn && (
            <button
              onClick={() => setOpenModal('time')}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', background: 'transparent',
                border: '1px solid #1e1e1e', color: '#555', cursor: 'pointer',
                fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                transition: 'border-color 0.1s, color 0.1s', ...mono,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}
            >
              <Clock size={11} /> Edit Time
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PROFILE GRID — Skills · Roles · Experience · Locations · Companies · Digest Time
          ══════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '1px', background: '#1e1e1e', marginBottom: '1px',
      }}>

        {/* Skills */}
        <SectionCard title="Your Skills" prefix="// skills" icon={<Zap size={13} />} onEdit={() => setOpenModal('skills')} saving={saving}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px' }}>
            {profile.skills?.map(s => <Tag key={s}>{s}</Tag>)}
            {!profile.skills?.length && <span style={{ fontSize: '11px', color: '#333' }}>No skills added yet</span>}
          </div>
        </SectionCard>

        {/* Target Roles */}
        <SectionCard title="Target Roles" prefix="// target_roles" icon={<Target size={13} />} onEdit={() => setOpenModal('roles')} saving={saving}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px' }}>
            {profile.target_roles?.map(r => <Tag key={r}>{r}</Tag>)}
            {!profile.target_roles?.length && <span style={{ fontSize: '11px', color: '#333' }}>No roles added yet</span>}
          </div>
        </SectionCard>

        {/* Experience */}
        <SectionCard title="Experience Level" prefix="// experience" icon={<Activity size={13} />} onEdit={() => setOpenModal('experience')} saving={saving}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '5px 14px', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              background: `${expLevel.color}12`, border: `1px solid ${expLevel.color}40`,
              color: expLevel.color,
            }}>
              {expLevel.label}
            </span>
            <span style={{ fontSize: '12px', color: '#888' }}>
              {expYears === 0 ? '0 years' : `${expYears} year${expYears !== 1 ? 's' : ''}`}
            </span>
            <span style={{ fontSize: '11px', color: '#555', width: '100%' }}>{expLevel.hint}</span>
          </div>
        </SectionCard>

        {/* Locations */}
        <SectionCard title="Locations" prefix="// locations" icon={<Globe size={13} />} onEdit={() => setOpenModal('locations')} saving={saving}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px' }}>
            {displayLocations.map(l => (
              <Tag key={l}><MapPin size={10} style={{ marginRight: '4px' }} />{l}</Tag>
            ))}
            {profile.remote && <Tag><Wifi size={10} style={{ marginRight: '4px' }} />Remote</Tag>}
            {!displayLocations.length && !profile.remote && (
              <span style={{ fontSize: '11px', color: '#333' }}>No locations set</span>
            )}
          </div>
        </SectionCard>

        {/* Company Preferences — left half */}
        <SectionCard title="Company Preferences" prefix="// company_pref" icon={<Building2 size={13} />} onEdit={() => setOpenModal('companies')} saving={saving}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px' }}>
            {profile.company_pref?.map(c => {
              const info = COMPANY_OPTIONS.find(o => o.id === c)
              return info ? <Tag key={c}>{info.label}</Tag> : null
            })}
            {!profile.company_pref?.length && <span style={{ fontSize: '11px', color: '#333' }}>No preferences set</span>}
          </div>
        </SectionCard>

        {/* Digest Time — right half, next to companies */}
        <SectionCard title="Digest Time" prefix="// digest_time" icon={<Clock size={13} />} onEdit={() => setOpenModal('time')} saving={saving}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '28px', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.04em', lineHeight: 1,
            }}>
              {formatTime(profile.digest_time)}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '8px' }}>
            {digestOn
              ? 'Daily job digest delivery time'
              : <span style={{ color: '#444' }}>Digest is paused — no emails sent</span>}
          </div>
        </SectionCard>
      </div>

      {/* ══════════════════════════════════════════════════════
          AI INSIGHTS
          ══════════════════════════════════════════════════════ */}
      <div style={{
        background: '#111', border: '1px solid #1e1e1e',
        borderLeft: '2px solid #00d4ff', padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={13} color="#00d4ff" />
          <span style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            // ai_insights
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#1e1e1e' }}>
          {[
            {
              idx: '01',
              text: `${profile.skills?.length ?? 0} skills match across ${Math.min(3, profile.target_roles?.length ?? 1)} active job categories`,
            },
            {
              idx: '02',
              text: profile.remote
                ? 'Remote enabled — your job reach is 3× wider than location-only searches'
                : 'Tip: Enable remote in Locations to 3× your job matches instantly',
            },
            {
              idx: '03',
              text: expYears === 0
                ? 'Fresher mode on — entry-level, graduate, and junior positions only'
                : `${expLevel.label} filter active — targeting ${expLevel.label.toLowerCase()} positions for ${expYears}yr experience`,
            },
            {
              idx: '04',
              text: digestOn
                ? `Digest active — job matches arriving daily at ${formatTime(profile.digest_time)}`
                : 'Digest is paused — toggle on to resume your daily job feed',
            },
          ].map(({ idx, text }) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '12px 16px', background: '#0a0a0a',
            }}>
              <span style={{ fontSize: '10px', color: '#00d4ff', minWidth: '20px', letterSpacing: '0.1em' }}>{idx}</span>
              <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.7 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ── */}
      <SkillsModal     isOpen={openModal === 'skills'}     skills={profile.skills || []}         onSave={skills => save({ skills })}                                           onClose={() => setOpenModal(null)} />
      <RolesModal      isOpen={openModal === 'roles'}      roles={profile.target_roles || []}    onSave={target_roles => save({ target_roles })}                               onClose={() => setOpenModal(null)} />
      <LocationsModal  isOpen={openModal === 'locations'}  locations={profile.locations || []}   remote={profile.remote || false} onSave={(locations, remote) => save({ locations, remote })} onClose={() => setOpenModal(null)} />
      <CompaniesModal  isOpen={openModal === 'companies'}  selected={profile.company_pref || []} onSave={company_pref => save({ company_pref })}                               onClose={() => setOpenModal(null)} />
      <ExperienceModal isOpen={openModal === 'experience'} years={profile.years_of_experience ?? 0} onSave={years_of_experience => save({ years_of_experience })}              onClose={() => setOpenModal(null)} />
      <DigestTimeModal isOpen={openModal === 'time'}       time={profile.digest_time || '09:00'} onSave={digest_time => save({ digest_time })}                                 onClose={() => setOpenModal(null)} />
    </div>
  )
}