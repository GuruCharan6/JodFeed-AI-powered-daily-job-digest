import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authstore'
import { signOut } from '../../api/auth'
import { LogOut, User } from 'lucide-react'
import { showToast } from '../ui/Toast'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      logout()
      showToast.success('Signed out')
      navigate('/login')
    } catch {
      showToast.error('Failed to sign out')
    }
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1e1e1e',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 32px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: '#00d4ff',
          }}
        >
          Job<span style={{ color: '#e0e0e0' }}>Feed</span>
        </Link>

        {/* Right side */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* User email */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#555',
                letterSpacing: '0.05em',
              }}
              className="hidden sm:flex"
            >
              <User size={12} color="#555" />
              <span>{user.email}</span>
            </div>

            {/* Status dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#00d4ff',
                }}
                className="animate-pulse-cyan"
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  color: '#555',
                  textTransform: 'uppercase',
                }}
              >
                LIVE
              </span>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#555',
                background: 'transparent',
                border: '1px solid #1e1e1e',
                padding: '5px 12px',
                cursor: 'pointer',
                transition: 'border-color 0.1s, color 0.1s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#00d4ff'
                e.currentTarget.style.color = '#00d4ff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1e1e1e'
                e.currentTarget.style.color = '#555'
              }}
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}