import { FileText, PenLine, Sparkles, Zap } from 'lucide-react'

interface Props {
  value: 'resume' | 'manual' | null
  onChange: (v: 'resume' | 'manual') => void
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function Step0Method({ value, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#1e1e1e' }}>

      {/* Resume upload */}
      <button
        type="button"
        onClick={() => onChange('resume')}
        style={{
          padding: '24px',
          background: value === 'resume' ? 'rgba(0,212,255,0.06)' : '#0a0a0a',
          border: 'none',
          borderLeft: `2px solid ${value === 'resume' ? '#00d4ff' : 'transparent'}`,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.1s, border-color 0.1s',
          position: 'relative',
        }}
        onMouseEnter={e => { if (value !== 'resume') (e.currentTarget as HTMLButtonElement).style.background = '#0d0d0d' }}
        onMouseLeave={e => { if (value !== 'resume') (e.currentTarget as HTMLButtonElement).style.background = '#0a0a0a' }}
      >
        {value === 'resume' && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '16px', height: '16px',
            background: '#00d4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        <div style={{
          width: '40px', height: '40px',
          background: value === 'resume' ? 'rgba(0,212,255,0.1)' : '#111',
          border: `1px solid ${value === 'resume' ? 'rgba(0,212,255,0.3)' : '#1e1e1e'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
          transition: 'all 0.1s',
        }}>
          <FileText size={18} color={value === 'resume' ? '#00d4ff' : '#555'} />
        </div>

        <h3 style={{
          fontSize: '13px', fontWeight: 700,
          color: value === 'resume' ? '#fff' : '#e0e0e0',
          marginBottom: '6px', ...mono,
        }}>
          Upload Resume
        </h3>
        <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.7, marginBottom: '14px', ...mono }}>
          Upload your PDF and AI will auto-fill everything for you
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: value === 'resume' ? '#00d4ff' : '#555', ...mono,
        }}>
          <Sparkles size={11} /> AI-powered · saves 5 mins
        </div>
      </button>

      {/* Manual */}
      <button
        type="button"
        onClick={() => onChange('manual')}
        style={{
          padding: '24px',
          background: value === 'manual' ? 'rgba(0,212,255,0.06)' : '#0a0a0a',
          border: 'none',
          borderLeft: `2px solid ${value === 'manual' ? '#00d4ff' : 'transparent'}`,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.1s, border-color 0.1s',
          position: 'relative',
        }}
        onMouseEnter={e => { if (value !== 'manual') (e.currentTarget as HTMLButtonElement).style.background = '#0d0d0d' }}
        onMouseLeave={e => { if (value !== 'manual') (e.currentTarget as HTMLButtonElement).style.background = '#0a0a0a' }}
      >
        {value === 'manual' && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '16px', height: '16px',
            background: '#00d4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        <div style={{
          width: '40px', height: '40px',
          background: value === 'manual' ? 'rgba(0,212,255,0.1)' : '#111',
          border: `1px solid ${value === 'manual' ? 'rgba(0,212,255,0.3)' : '#1e1e1e'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
          transition: 'all 0.1s',
        }}>
          <PenLine size={18} color={value === 'manual' ? '#00d4ff' : '#555'} />
        </div>

        <h3 style={{
          fontSize: '13px', fontWeight: 700,
          color: value === 'manual' ? '#fff' : '#e0e0e0',
          marginBottom: '6px', ...mono,
        }}>
          Fill Manually
        </h3>
        <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.7, marginBottom: '14px', ...mono }}>
          Enter your skills, roles, and preferences step-by-step yourself
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: value === 'manual' ? '#00d4ff' : '#555', ...mono,
        }}>
          <Zap size={11} /> Full control · ~3 mins
        </div>
      </button>
    </div>
  )
}