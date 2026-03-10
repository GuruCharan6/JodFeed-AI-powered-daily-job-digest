import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/profile/`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          const data = await res.json()
          navigate(data.onboarding_complete ? '/dashboard' : '/onboarding')
        } catch {
          navigate('/onboarding')
        }
      }
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '24px',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Logo */}
      <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        <span style={{ color: '#00d4ff' }}>Job</span>
        <span style={{ color: '#e0e0e0' }}>Feed</span>
      </div>

      {/* Terminal loader */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em' }}>
            //
          </span>
          <span style={{ fontSize: '11px', color: '#888', letterSpacing: '0.1em' }}>
            signing_you_in
          </span>
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '13px',
              background: '#00d4ff',
              marginLeft: '2px',
            }}
            className="animate-blink"
          />
        </div>

        {/* Progress bar */}
        <div style={{ width: '200px', height: '1px', background: '#1e1e1e', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            height: '100%',
            background: '#00d4ff',
            boxShadow: '0 0 8px rgba(0,212,255,0.6)',
            animation: 'authbar 1.4s ease-in-out infinite',
          }} />
        </div>

        <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Authenticating session
        </div>
      </div>

      <style>{`
        @keyframes authbar {
          0%   { width: 0%;  left: 0%; }
          50%  { width: 50%; left: 25%; }
          100% { width: 0%;  left: 100%; }
        }
      `}</style>
    </div>
  )
}