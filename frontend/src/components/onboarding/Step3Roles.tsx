import { useState, KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'

const SUGGESTIONS = [
  'Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer',
  'DevOps Engineer','Data Scientist','Data Analyst','ML Engineer','AI Engineer',
  'Product Manager','UI/UX Designer','Mobile Developer','iOS Developer','Android Developer',
  'Cloud Architect','Site Reliability Engineer','QA Engineer','Security Engineer',
  'Tech Lead','Engineering Manager','CTO','Solutions Architect','Database Administrator',
  'Blockchain Developer','Game Developer',
]

interface Props { value: string[]; onChange: (v: string[]) => void }

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function Step3Roles({ value, onChange }: Props) {
  const [input, setInput] = useState('')

  const add = (role: string) => {
    const trimmed = role.trim()
    if (trimmed && !value.includes(trimmed) && value.length < 10) onChange([...value, trimmed])
    setInput('')
  }
  const remove = (role: string) => onChange(value.filter(r => r !== role))
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1])
  }

  const filtered = SUGGESTIONS.filter(s => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', ...mono }}>

      {/* Tag input */}
      <div>
        <label style={{ fontSize: '10px', color: '#888', letterSpacing: '0.16em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          Target Roles <span style={{ color: '#555' }}>({value.length}/10)</span>
        </label>
        <div
          style={{
            minHeight: '56px', padding: '10px 12px',
            background: '#0a0a0a', border: '1px solid #1e1e1e',
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
            cursor: 'text',
          }}
          onClick={() => document.getElementById('role-input')?.focus()}
        >
          {value.map(role => (
            <span key={role} style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 9px', fontSize: '11px',
              background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
              color: '#00d4ff',
            }}>
              {role}
              <button type="button" onClick={() => remove(role)} style={{
                background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0, display: 'flex',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ))}
          <input
            id="role-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={value.length === 0 ? 'e.g. Frontend Developer…' : 'Add more…'}
            style={{
              flex: '1 1 160px', background: 'transparent', border: 'none',
              outline: 'none', fontSize: '12px', color: '#e0e0e0', padding: '2px 0', ...mono,
            }}
          />
        </div>
        <p style={{ marginTop: '6px', fontSize: '10px', color: '#555', letterSpacing: '0.08em' }}>
          Press Enter to add · Backspace to remove last
        </p>
      </div>

      {/* Suggestions */}
      {filtered.length > 0 && (
        <div>
          <p style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>
            // suggestions
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {filtered.slice(0, 14).map(r => (
              <button key={r} type="button" onClick={() => add(r)} style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', fontSize: '11px',
                background: 'transparent', border: '1px solid #1e1e1e',
                color: '#555', cursor: 'pointer', transition: 'all 0.1s', ...mono,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.background = 'rgba(0,212,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent' }}
              >
                <Plus size={10} strokeWidth={3} /> {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00d4ff' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          {value.length} role{value.length > 1 ? 's' : ''} targeted
        </div>
      )}
    </div>
  )
}