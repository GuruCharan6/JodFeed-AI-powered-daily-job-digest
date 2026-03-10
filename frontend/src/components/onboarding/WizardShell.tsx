import { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import Button from '../ui/Button'

interface WizardShellProps {
  step: number
  totalSteps: number
  title: string
  subtitle: string
  children: ReactNode
  onNext: () => void
  onBack?: () => void
  isLast?: boolean
  isLoading?: boolean
  canProceed?: boolean
  stepLabels: string[]
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function WizardShell({
  step, totalSteps, title, subtitle, children,
  onNext, onBack, isLast, isLoading, canProceed = true, stepLabels,
}: WizardShellProps) {
  const pct = ((step - 1) / Math.max(totalSteps - 1, 1)) * 100

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      position: 'relative',
      overflow: 'hidden',
      ...mono,
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: 0.4,
      }} />

      {/* Logo */}
      <div style={{ marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <span style={{ color: '#00d4ff' }}>Job</span>
          <span style={{ color: '#e0e0e0' }}>Feed</span>
        </span>
      </div>

      {/* Wizard card */}
      <div style={{ width: '100%', maxWidth: '600px', position: 'relative', zIndex: 1 }}>

        {/* Step dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
          {Array.from({ length: totalSteps }).map((_, i) => {
            const done   = i + 1 < step
            const active = i + 1 === step
            return (
              <div key={i} style={{
                height: '4px',
                width: active ? '24px' : '6px',
                background: done ? '#00ff88' : active ? '#00d4ff' : '#1e1e1e',
                transition: 'all 0.2s',
                boxShadow: active ? '0 0 6px rgba(0,212,255,0.5)' : done ? '0 0 4px rgba(0,255,136,0.3)' : 'none',
              }} />
            )
          })}
        </div>

        {/* Progress bar */}
        <div style={{ height: '1px', background: '#1e1e1e', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{
            height: '100%', background: '#00d4ff',
            width: `${pct}%`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 0 8px rgba(0,212,255,0.4)',
          }} />
        </div>

        {/* Step label row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '10px', color: '#555', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: '28px',
        }}>
          <span>Step {step} / {totalSteps}</span>
          <span style={{ color: '#00d4ff' }}>{stepLabels[step - 1]}</span>
        </div>

        {/* Main card */}
        <div style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderTop: '2px solid #00d4ff',
          padding: '32px',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '10px', color: '#00d4ff', letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#00d4ff', display: 'inline-block',
              }} className="animate-pulse-cyan" />
              Setup · {step}/{totalSteps}
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '6px', letterSpacing: '-0.01em' }}>
              {title}
            </h1>
            <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.7 }}>{subtitle}</p>
          </div>

          {/* Step content */}
          <div style={{ marginBottom: '28px' }}>{children}</div>

          {/* Navigation */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: '20px', borderTop: '1px solid #1e1e1e',
          }}>
            <div>
              {onBack && (
                <button
                  onClick={onBack}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: 'transparent',
                    border: '1px solid #1e1e1e', color: '#555', cursor: 'pointer',
                    fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    transition: 'border-color 0.1s, color 0.1s', ...mono,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}
                >
                  <ChevronLeft size={13} /> Back
                </button>
              )}
            </div>
            <Button onClick={onNext} isLoading={isLoading} disabled={!canProceed} size="lg">
              {isLast ? (
                <><Check size={14} /> Complete Setup</>
              ) : (
                <>Continue <ChevronRight size={13} /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}