import { useState, KeyboardEvent } from 'react'
import { MapPin, X, Wifi } from 'lucide-react'

const POPULAR = [
  'Bangalore','Mumbai','Delhi','Hyderabad','Chennai','Pune',
  'Kolkata','Noida','Gurgaon','Ahmedabad',
  'San Francisco','New York','London','Singapore','Dubai',
]

interface Props {
  locations: string[]
  remote: boolean
  onChange: (locations: string[], remote: boolean) => void
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function Step4Location({ locations, remote, onChange }: Props) {
  const [input, setInput] = useState('')

  const add = (loc: string) => {
    const trimmed = loc.trim()
    if (trimmed && !locations.includes(trimmed) && locations.length < 5) onChange([...locations, trimmed], remote)
    setInput('')
  }
  const remove = (loc: string) => onChange(locations.filter(l => l !== loc), remote)
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && locations.length) remove(locations[locations.length - 1])
  }

  const filtered = POPULAR.filter(p => !locations.includes(p) && p.toLowerCase().includes(input.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', ...mono }}>

      {/* Location tag input */}
      <div>
        <label style={{ fontSize: '10px', color: '#888', letterSpacing: '0.16em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
          Preferred Locations <span style={{ color: '#555' }}>({locations.length}/5)</span>
        </label>
        <div
          style={{
            minHeight: '56px', padding: '10px 12px',
            background: '#0a0a0a', border: '1px solid #1e1e1e',
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
            cursor: 'text',
          }}
          onClick={() => document.getElementById('loc-input')?.focus()}
        >
          {locations.map(loc => (
            <span key={loc} style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 9px', fontSize: '11px',
              background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
              color: '#00d4ff',
            }}>
              <MapPin size={10} /> {loc}
              <button type="button" onClick={() => remove(loc)} style={{
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
            id="loc-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={locations.length === 0 ? 'e.g. Bangalore, Mumbai…' : 'Add another…'}
            disabled={locations.length >= 5}
            style={{
              flex: '1 1 140px', background: 'transparent', border: 'none',
              outline: 'none', fontSize: '12px', color: '#e0e0e0', padding: '2px 0', ...mono,
            }}
          />
        </div>
        <p style={{ marginTop: '6px', fontSize: '10px', color: '#555', letterSpacing: '0.08em' }}>
          Press Enter to add · Up to 5 cities
        </p>
      </div>

      {/* Popular cities */}
      {filtered.length > 0 && (
        <div>
          <p style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>
            // popular_cities
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {filtered.slice(0, 10).map(loc => (
              <button key={loc} type="button" onClick={() => add(loc)}
                disabled={locations.length >= 5}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', fontSize: '11px',
                  background: 'transparent', border: '1px solid #1e1e1e',
                  color: '#555', cursor: 'pointer', transition: 'all 0.1s', ...mono,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.background = 'rgba(0,212,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'transparent' }}
              >
                <MapPin size={10} /> {loc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '1px', background: '#1e1e1e' }} />

      {/* Remote toggle */}
      <button
        type="button"
        onClick={() => onChange(locations, !remote)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px', cursor: 'pointer',
          background: remote ? 'rgba(0,212,255,0.06)' : '#0a0a0a',
          border: `1px solid ${remote ? 'rgba(0,212,255,0.3)' : '#1e1e1e'}`,
          transition: 'all 0.1s', width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: remote ? 'rgba(0,212,255,0.1)' : '#111',
            border: `1px solid ${remote ? 'rgba(0,212,255,0.3)' : '#1e1e1e'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.1s',
          }}>
            <Wifi size={16} color={remote ? '#00d4ff' : '#555'} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#e0e0e0', marginBottom: '2px' }}>Include Remote Jobs</p>
            <p style={{ fontSize: '11px', color: '#555' }}>Get remote-friendly opportunities worldwide</p>
          </div>
        </div>

        {/* Toggle */}
        <div style={{
          width: '40px', height: '22px', borderRadius: '11px',
          background: remote ? '#00d4ff' : '#1e1e1e',
          position: 'relative', transition: 'background 0.15s', flexShrink: 0,
          boxShadow: remote ? '0 0 8px rgba(0,212,255,0.4)' : 'none',
        }}>
          <div style={{
            position: 'absolute', top: '3px',
            left: remote ? '21px' : '3px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#fff', transition: 'left 0.15s',
          }} />
        </div>
      </button>

      {/* Summary */}
      {(locations.length > 0 || remote) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#00ff88' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          {locations.length > 0 && <span>{locations.length} location{locations.length > 1 ? 's' : ''}</span>}
          {locations.length > 0 && remote && <span style={{ color: '#333' }}>·</span>}
          {remote && <span>Remote included</span>}
        </div>
      )}
    </div>
  )
}