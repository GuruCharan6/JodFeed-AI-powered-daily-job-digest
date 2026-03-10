import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, signInGoogle } from '../api/auth'
import { getProfile } from '../api/profile'
import { useAuthStore } from '../store/authstore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { showToast } from '../components/ui/Toast'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FD = z.infer<typeof schema>

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FD>({ resolver: zodResolver(schema) })

  useEffect(() => { if (user) checkOnboarding() }, [user])

  const checkOnboarding = async () => {
    try {
      const { data } = await getProfile()
      navigate(data?.onboarding_complete ? '/dashboard' : '/onboarding')
    } catch { navigate('/onboarding') }
  }

  const onSubmit = async (data: FD) => {
    setLoading(true)
    const { error } = await signIn(data.email, data.password)
    setLoading(false)
    if (error) showToast.error(error.message)
    else showToast.success('Welcome back')
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      ...mono,
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        opacity: 0.3,
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }} className="animate-fade-in">

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
          <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px' }}>
            // sign_in
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '28px' }}>
            Sign in to see today's job matches
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="label" style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{
                  fontSize: '10px', color: '#555', textDecoration: 'none',
                  letterSpacing: '0.08em',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00d4ff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#555')}
                >
                  Forgot?
                </Link>
              </div>
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
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
            </div>
            <Button type="submit" isLoading={loading} fullWidth size="lg">
              Sign in <ArrowRight size={14} />
            </Button>
          </form>
        </div>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#555' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 600 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#00d4ff')}
          >
            Sign up free
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}