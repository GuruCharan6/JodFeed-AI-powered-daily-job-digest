import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react'
import { uploadResume } from '../../api/profile'

interface ParsedData {
  skills: string[]
  target_roles: string[]
  locations: string[]
  full_name?: string
  summary?: string
}

interface Props {
  onParsed: (data: ParsedData) => void
  parsedData: ParsedData | null
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

const PARSE_STAGES = ['Reading document…', 'Extracting skills…', 'Identifying roles…', 'Organizing data…']

function Tag({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px', fontSize: '11px',
      background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
      color: '#00d4ff', ...mono,
    }}>
      {children}
      {onRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0, display: 'flex' }}>
          <X size={10} />
        </button>
      )}
    </span>
  )
}

export default function Step1Resume({ onParsed, parsedData }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [_isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [stage, setStage] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [stageIdx, setStageIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return }
    setFile(f); setError(''); setIsUploading(true); setStage('parsing')
    let i = 0
    const interval = setInterval(() => {
      i++; if (i < PARSE_STAGES.length) setStageIdx(i); else clearInterval(interval)
    }, 900)
    try {
      const res = await uploadResume(f)
      clearInterval(interval); setStageIdx(3)
      await new Promise(r => setTimeout(r, 400))
      onParsed(res.data); setStage('done')
    } catch {
      clearInterval(interval)
      setError('Failed to parse resume. Try again or fill manually.')
      setStage('error')
    } finally { setIsUploading(false) }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }, [])

  const reset = () => {
    setFile(null); setStage('idle'); setError(''); setStageIdx(0)
    onParsed({ skills: [], target_roles: [], locations: [] })
  }

  /* ── DONE state ── */
  if (stage === 'done' && parsedData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...mono }}>
        {/* Success banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px',
          background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)',
        }}>
          <CheckCircle size={16} color="#00ff88" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#00ff88', marginBottom: '2px' }}>
              Resume parsed successfully
            </p>
            <p style={{ fontSize: '11px', color: '#555' }}>
              Review extracted info below. Edit in next steps.
            </p>
          </div>
          <button onClick={reset} style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px', background: 'transparent',
            border: '1px solid #1e1e1e', color: '#555', cursor: 'pointer',
            fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', ...mono,
            transition: 'border-color 0.1s, color 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}
          >
            <RefreshCw size={11} /> Re-upload
          </button>
        </div>

        {/* File chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', background: '#0a0a0a', border: '1px solid #1e1e1e',
        }}>
          <FileText size={14} color="#00d4ff" />
          <span style={{ fontSize: '12px', color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file?.name}
          </span>
          <span style={{ fontSize: '10px', color: '#555' }}>{((file?.size || 0) / 1024).toFixed(0)} KB</span>
        </div>

        {/* Parsed preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#1e1e1e' }}>
          {parsedData.full_name && (
            <div style={{ padding: '14px 16px', background: '#0a0a0a' }}>
              <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
                // name_detected
              </div>
              <span style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: 600 }}>{parsedData.full_name}</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#1e1e1e' }}>
            <div style={{ padding: '14px 16px', background: '#0a0a0a' }}>
              <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>
                // skills ({parsedData.skills.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {parsedData.skills.slice(0, 8).map(s => <Tag key={s}>{s}</Tag>)}
                {parsedData.skills.length > 8 && (
                  <span style={{ fontSize: '10px', color: '#555', alignSelf: 'center' }}>+{parsedData.skills.length - 8} more</span>
                )}
              </div>
            </div>
            <div style={{ padding: '14px 16px', background: '#0a0a0a' }}>
              <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>
                // roles ({parsedData.target_roles.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {parsedData.target_roles.map(r => <Tag key={r}>{r}</Tag>)}
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '10px', color: '#555', textAlign: 'center', letterSpacing: '0.08em' }}>
          // You can add, remove or edit these in the next steps
        </p>
      </div>
    )
  }

  /* ── PARSING state ── */
  if (stage === 'parsing') {
    return (
      <div style={{
        padding: '48px 0', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '16px', ...mono,
      }}>
        <div style={{
          width: '56px', height: '56px',
          background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={24} color="#00d4ff" className="animate-pulse-cyan" />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '6px' }}>
            // ai_parsing
          </div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0', marginBottom: '4px' }}>
            AI is reading your resume
          </p>
          <p style={{ fontSize: '11px', color: '#888' }}>{PARSE_STAGES[stageIdx]}</p>
        </div>

        {/* Progress */}
        <div style={{ width: '200px', height: '1px', background: '#1e1e1e', overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#00d4ff',
            width: `${((stageIdx + 1) / PARSE_STAGES.length) * 100}%`,
            transition: 'width 0.6s ease',
            boxShadow: '0 0 8px rgba(0,212,255,0.4)',
          }} />
        </div>

        {/* Stage dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {PARSE_STAGES.map((_, i) => (
            <div key={i} style={{
              height: '3px', width: '32px',
              background: i <= stageIdx ? '#00d4ff' : '#1e1e1e',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>
    )
  }

  /* ── IDLE / ERROR state ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...mono }}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '48px 24px',
          background: isDragging ? 'rgba(0,212,255,0.06)' : '#0a0a0a',
          border: `1px dashed ${isDragging ? '#00d4ff' : '#2a2a2a'}`,
          cursor: 'pointer', transition: 'all 0.1s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00d4ff' }}
        onMouseLeave={e => { if (!isDragging) (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a2a' }}
      >
        <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

        <div style={{
          width: '48px', height: '48px',
          background: isDragging ? 'rgba(0,212,255,0.1)' : '#111',
          border: `1px solid ${isDragging ? 'rgba(0,212,255,0.4)' : '#1e1e1e'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px', transition: 'all 0.1s',
        }}>
          <Upload size={20} color={isDragging ? '#00d4ff' : '#555'} />
        </div>

        <p style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0', marginBottom: '4px' }}>
          {isDragging ? 'Drop it here' : 'Drag & drop your resume'}
        </p>
        <p style={{ fontSize: '11px', color: '#555', marginBottom: '16px' }}>or click to browse</p>
        <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <span>PDF only</span>
          <span>·</span>
          <span>Max 5MB</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.25)',
        }}>
          <AlertCircle size={14} color="#ff4444" />
          <p style={{ fontSize: '12px', color: '#ff4444' }}>{error}</p>
        </div>
      )}

      {/* Info */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '12px 14px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)',
      }}>
        <Sparkles size={13} color="#00d4ff" style={{ marginTop: '1px', flexShrink: 0 }} />
        <p style={{ fontSize: '11px', color: '#888', lineHeight: 1.7 }}>
          AI will extract your skills, roles, and locations automatically.
          You can review and edit everything before saving.
        </p>
      </div>
    </div>
  )
}