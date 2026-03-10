import { useState, KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'

const SUGGESTIONS = [
  'React','Node.js','TypeScript','Python','Java','Go','Rust','Vue.js','Angular',
  'Next.js','GraphQL','PostgreSQL','MongoDB','Redis','Docker','Kubernetes',
  'AWS','GCP','Azure','CI/CD','Machine Learning','Data Science','Figma',
  'Swift','Kotlin','Flutter','Django','FastAPI','Spring Boot','Terraform',
]

interface Props { value: string[]; onChange: (v: string[]) => void }

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function Step2Skills({ value, onChange }: Props) {
  const [input, setInput] = useState('')

  const add = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !value.includes(trimmed) && value.length < 20) onChange([...value, trimmed])
    setInput('')
  }
  const remove = (skill: string) => onChange(value.filter(s => s !== skill))
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1])
  }

  const filtered = SUGGESTIONS.filter(s => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', ...mono }}>

      {/* Tag input box */}
      <div>
        <label style={{ fontSize: '10px', color: '#888', letterSpacing: '0.16em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          Your Skills <span style={{ color: '#555' }}>({value.length}/20)</span>
        </label>
        <div
          style={{
            minHeight: '56px', padding: '10px 12px',
            background: '#0a0a0a', border: '1px solid #1e1e1e',
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
            cursor: 'text', transition: 'border-color 0.1s',
          }}
          onClick={() => document.getElementById('skill-input')?.focus()}
          onFocus={() => {}}
        >
          {value.map(skill => (
            <span key={skill} style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 9px', fontSize: '11px',
              background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
              color: '#00d4ff',
            }}>
              {skill}
              <button type="button" onClick={() => remove(skill)} style={{
                background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                padding: 0, display: 'flex',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ff4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ))}
          <input
            id="skill-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={value.length === 0 ? 'Type a skill and press Enter…' : 'Add more…'}
            style={{
              flex: '1 1 120px', background: 'transparent', border: 'none',
              outline: 'none', fontSize: '12px', color: '#e0e0e0',
              padding: '2px 0', ...mono,
            }}
          />
        </div>
        <p style={{ marginTop: '6px', fontSize: '10px', color: '#555', letterSpacing: '0.08em' }}>
          Press Enter or comma to add · Backspace to remove last
        </p>
      </div>

      {/* Suggestions */}
      {filtered.length > 0 && (
        <div>
          <p style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>
            // quick_add
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {filtered.slice(0, 16).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', fontSize: '11px',
                  background: 'transparent', border: '1px solid #1e1e1e',
                  color: '#555', cursor: 'pointer', transition: 'all 0.1s', ...mono,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.background = 'rgba(0,212,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent' }}
              >
                <Plus size={10} strokeWidth={3} /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Count */}
      {value.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00ff88' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          {value.length} skill{value.length > 1 ? 's' : ''} added
        </div>
      )}
    </div>
  )
}