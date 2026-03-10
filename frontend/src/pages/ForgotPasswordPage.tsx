import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetPassword } from '../api/auth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { showToast } from '../components/ui/Toast'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FD = z.infer<typeof schema>

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FD>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FD) => {
    setLoading(true)
    const { error } = await resetPassword(data.email)
    setLoading(false)
    if (error) showToast.error(error.message)
    else setSent(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      ...mono,
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span style={{ color: '#00d4ff' }}>Job</span>
            <span style={{ color: '#e0e0e0' }}>Feed</span>
          </span>
        </Link>

        {/* Card */}
        <div style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderTop: '2px solid #00d4ff',
          padding: '32px',
        }}>
          {sent ? (
            /* ── Sent state ── */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: '48px', height: '48px',
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircle size={22} color="#00ff88" />
              </div>
              <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px' }}>
                // email_sent
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.8, marginBottom: '28px' }}>
                A reset link has been sent to your email address. Follow the instructions to reset your password.
              </p>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'transparent', border: '1px solid #1e1e1e',
                  color: '#888', padding: '8px 16px',
                  fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  cursor: 'pointer', ...mono,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#888' }}
                >
                  <ArrowLeft size={12} /> Back to sign in
                </button>
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px' }}>
                // reset_password
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                Reset your password
              </h1>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '28px', lineHeight: 1.7 }}>
                Enter your email and we'll send a reset link
              </p>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  icon={<Mail size={14} />}
                  {...register('email')}
                  error={errors.email?.message}
                />
                <Button type="submit" isLoading={loading} fullWidth size="lg">
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        {!sent && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', color: '#555', textDecoration: 'none',
              letterSpacing: '0.08em',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#00d4ff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}
            >
              <ArrowLeft size={12} /> Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}