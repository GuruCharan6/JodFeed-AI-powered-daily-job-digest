import toast from 'react-hot-toast'

const mono = "'JetBrains Mono', monospace"

const base: React.CSSProperties = {
  fontFamily: mono,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.06em',
  borderRadius: 0,
  padding: '10px 14px',
}

export const showToast = {
  success: (msg: string) =>
    toast.success(msg, {
      style: {
        ...base,
        background: '#0a0a0a',
        color: '#00ff88',
        border: '1px solid rgba(0,255,136,0.25)',
        borderLeft: '2px solid #00ff88',
        boxShadow: '0 4px 24px rgba(0,0,0,0.8)',
      },
      iconTheme: { primary: '#00ff88', secondary: '#000' },
    }),

  error: (msg: string) =>
    toast.error(msg, {
      style: {
        ...base,
        background: '#0a0a0a',
        color: '#ff4444',
        border: '1px solid rgba(255,68,68,0.25)',
        borderLeft: '2px solid #ff4444',
        boxShadow: '0 4px 24px rgba(0,0,0,0.8)',
      },
      iconTheme: { primary: '#ff4444', secondary: '#000' },
    }),

  loading: (msg: string) =>
    toast.loading(msg, {
      style: {
        ...base,
        background: '#0a0a0a',
        color: '#888',
        border: '1px solid #1e1e1e',
        borderLeft: '2px solid #00d4ff',
        boxShadow: '0 4px 24px rgba(0,0,0,0.8)',
      },
    }),

  dismiss: toast.dismiss,
}