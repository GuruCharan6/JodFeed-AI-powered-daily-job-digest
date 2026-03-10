import { Building2, Rocket, Wifi, Landmark, Heart, Globe } from 'lucide-react'

const TYPES = [
  { id: 'mnc',     label: 'MNC / Enterprise',  desc: 'Google, Microsoft, Amazon, Infosys…',  icon: Building2 },
  { id: 'startup', label: 'Startups',           desc: 'Seed to Series D, fast-growth',         icon: Rocket    },
  { id: 'remote',  label: 'Remote-first',       desc: 'Fully distributed, async-first teams',  icon: Wifi      },
  { id: 'govt',    label: 'Government / PSU',   desc: 'ISRO, DRDO, public sector enterprises', icon: Landmark  },
  { id: 'ngo',     label: 'NGO / Non-profit',   desc: 'Social impact, mission-driven orgs',    icon: Heart     },
  { id: 'all',     label: 'All Companies',      desc: 'Show me everything — no filter',        icon: Globe     },
]

interface Props { value: string[]; onChange: (v: string[]) => void }

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function Step5Companies({ value, onChange }: Props) {
  const toggle = (id: string) => {
    if (id === 'all') { onChange(value.includes('all') ? [] : ['all']); return }
    const without = value.filter(v => v !== 'all')
    onChange(without.includes(id) ? without.filter(v => v !== id) : [...without, id])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...mono }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#1e1e1e' }}>
        {TYPES.map(({ id, label, desc, icon: Icon }) => {
          const active = value.includes(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '16px', cursor: 'pointer', textAlign: 'left',
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
                width: '34px', height: '34px', flexShrink: 0,
                background: active ? 'rgba(0,212,255,0.1)' : '#111',
                border: `1px solid ${active ? 'rgba(0,212,255,0.3)' : '#1e1e1e'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: '1px', transition: 'all 0.1s',
              }}>
                <Icon size={15} color={active ? '#00d4ff' : '#555'} />
              </div>

              <div>
                <p style={{
                  fontSize: '12px', fontWeight: 700, marginBottom: '3px',
                  color: active ? '#e0e0e0' : '#888',
                }}>
                  {label}
                </p>
                <p style={{ fontSize: '10px', color: '#555', lineHeight: 1.6 }}>{desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {value.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00d4ff' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          {value.includes('all') ? 'All company types selected' : `${value.length} type${value.length > 1 ? 's' : ''} selected`}
        </div>
      )}
    </div>
  )
}