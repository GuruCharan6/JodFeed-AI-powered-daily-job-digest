import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUp, signInGoogle } from '../api/auth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { showToast } from '../components/ui/Toast'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })

type FD = z.infer<typeof schema>

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

const features = [
  { prefix: '01', text: 'Skills-based matching, not keyword spam' },
  { prefix: '02', text: 'Fresh jobs in your inbox every morning' },
  { prefix: '03', text: 'AI-powered profile setup in 3 minutes' },
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FD>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FD) => {
    setLoading(true)
    const { error } = await signUp(data.email, data.password)
    setLoading(false)
    if (error) showToast.error(error.message)
    else { showToast.success('Check your email to confirm'); navigate('/login') }
  }

  const handleGoogle = async () => {
    setGLoading(true)
    const { error } = await signInGoogle()
    setGLoading(false)
    if (error) showToast.error(error.message)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      ...mono,
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        opacity: 0.25,
      }} />

      {/* ── Left panel ── */}
      <div style={{
        display: 'none',
        width: '50%',
        padding: '48px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid #1e1e1e',
        position: 'relative',
        zIndex: 1,
      }} className="lg:flex lg:flex-col">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span style={{ color: '#00d4ff' }}>Job</span>
            <span style={{ color: '#e0e0e0' }}>Feed</span>
          </span>
        </Link>

        {/* Content */}
        <div>
          {/* Tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#00d4ff', border: '1px solid #00d4ff',
            padding: '4px 10px', marginBottom: '24px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d4ff' }} className="animate-pulse-cyan" />
            AI-powered job matching
          </div>

          <h2 style={{
            fontSize: '36px', fontWeight: 700, color: '#fff',
            lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.02em',
          }}>
            Jobs that fit <span style={{ color: '#00d4ff' }}>you</span>,<br />
            not the other way.
          </h2>
          <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.8, marginBottom: '40px', maxWidth: '380px' }}>
            Tell us once what you're looking for. Let AI do the rest.
            Wake up to perfectly matched jobs every morning.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#1e1e1e' }}>
            {features.map(({ prefix, text }) => (
              <div key={prefix} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '14px 16px', background: '#0a0a0a',
              }}>
                <span style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.1em', minWidth: '20px' }}>{prefix}</span>
                <span style={{ fontSize: '12px', color: '#888' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '10px', color: '#333', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Trusted by 10,000+ developers worldwide
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} className="animate-fade-in">

          {/* Mobile logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: '36px' }}
            className="lg:hidden">
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
            <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px' }}>
              // create_account
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              Create your account
            </h1>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '28px' }}>
              Start getting AI-matched job digests
            </p>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={gLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '10px', padding: '10px', background: 'transparent',
                border: '1px solid #1e1e1e', color: '#888', cursor: 'pointer',
                fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: '20px', transition: 'border-color 0.1s, color 0.1s',
                ...mono,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#e0e0e0' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#888' }}
            >
              {gLoading ? (
                <div style={{ width: '14px', height: '14px', border: '1px solid #555', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: '#1e1e1e' }} />
              <span style={{ fontSize: '10px', color: '#333', letterSpacing: '0.14em', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#1e1e1e' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail size={14} />}
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                icon={<Lock size={14} />}
                rightEl={
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#e0e0e0')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#555')}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                {...register('password')}
                error={errors.password?.message}
              />
              <Input
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                icon={<Lock size={14} />}
                rightEl={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#e0e0e0')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#555')}
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />
              <Button type="submit" isLoading={loading} fullWidth size="lg">
                Create account <ArrowRight size={14} />
              </Button>
            </form>
          </div>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#555' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#00d4ff')}
            >
              Sign in
            </Link>
          </p>
          <p style={{ marginTop: '10px', textAlign: 'center', fontSize: '10px', color: '#333' }}>
            By signing up you agree to our{' '}
            <a href="#" style={{ color: '#555', textDecoration: 'none' }}>Terms</a> &{' '}
            <a href="#" style={{ color: '#555', textDecoration: 'none' }}>Privacy Policy</a>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}