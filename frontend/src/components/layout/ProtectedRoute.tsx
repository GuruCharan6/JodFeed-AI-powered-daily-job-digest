import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authstore'
import Navbar from './Navbar'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOnboarding?: boolean
}

export default function ProtectedRoute({
  children,
  requireOnboarding: _requireOnboarding = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {/* Terminal-style loader */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#00d4ff', letterSpacing: '0.1em' }}>
            JOBFEED
          </span>
          <span style={{ fontSize: '12px', color: '#555', letterSpacing: '0.1em' }}>
            //
          </span>
          <span style={{ fontSize: '12px', color: '#555', letterSpacing: '0.1em' }}>
            authenticating
          </span>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '14px',
              background: '#00d4ff',
              marginLeft: '2px',
            }}
            className="animate-blink"
          />
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '160px',
            height: '1px',
            background: '#1e1e1e',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: '#00d4ff',
              boxShadow: '0 0 8px rgba(0,212,255,0.5)',
              animation: 'loadbar 1.2s ease-in-out infinite',
            }}
          />
        </div>

        <style>{`
          @keyframes loadbar {
            0%   { width: 0%;   margin-left: 0; }
            50%  { width: 60%;  margin-left: 20%; }
            100% { width: 0%;   margin-left: 100%; }
          }
        `}</style>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Navbar />
      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 32px',
        }}
      >
        {children}
      </main>
    </div>
  )
}