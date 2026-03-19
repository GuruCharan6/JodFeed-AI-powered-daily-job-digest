import { Link } from 'react-router-dom'
import { ArrowRight, Mail, Brain, MapPin, Clock, CheckCircle, BarChart2, Shield } from 'lucide-react'

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

const FEATURES = [
  { idx: '01', icon: Brain,    title: 'AI-Powered Matching', desc: 'AI reads your profile and finds jobs that actually match your skills, not just keywords.' },
  { idx: '02', icon: Mail,     title: 'Inbox Delivery',      desc: 'Curated digest of top matching jobs delivered directly to your inbox every day.' },
  { idx: '03', icon: MapPin,   title: 'Multi-Location',      desc: 'Set up to 5 preferred cities plus remote. Never miss an opportunity in your target market.' },
  { idx: '04', icon: Clock,    title: 'Your Schedule',       desc: 'Pick exactly when you want your digest — 7 AM, 9 AM, or any custom time.' },
  { idx: '05', icon: BarChart2, title: 'Smart Filtering',    desc: 'Filter by MNCs, startups, remote-first, government, NGO — only companies you want.' },
  { idx: '06', icon: Shield,   title: 'Resume Parsing',      desc: 'Upload your PDF once. AI extracts skills and roles automatically. Review and go.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign up & upload',       desc: 'Create account and upload resume or fill profile manually in under 3 minutes.' },
  { step: '02', title: 'AI organizes profile',   desc: 'AI extracts skills, roles, preferences. You review, tweak, confirm.' },
  { step: '03', title: 'Set your schedule',      desc: 'Pick when you want your daily digest — morning, noon, or evening.' },
  { step: '04', title: 'Jobs in your inbox',     desc: 'Wake up to a curated list of the best matching jobs every single day.' },
]

const STATS = [
  { value: '50K+',   label: 'jobs indexed daily' },
  { value: '98%',    label: 'delivery rate'       },
  { value: '< 3min', label: 'setup time'          },
  { value: '10x',    label: 'more relevant'       },
]

const TRUST = ['Free to use', 'No spam ever', 'Setup in 3 minutes', 'Cancel anytime']

const MOCK_JOBS = [
  { title: 'Senior React Developer', company: 'Razorpay', loc: 'Bangalore · Remote', salary: '₹25–40 LPA', match: '98' },
  { title: 'Full Stack Engineer',    company: 'Zepto',    loc: 'Mumbai',             salary: '₹18–28 LPA', match: '95' },
  { title: 'Frontend Lead',          company: 'Groww',    loc: 'Bangalore',          salary: '₹30–45 LPA', match: '92' },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#000', ...mono }}>

      {/* ── GRID BG ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: 0.5,
      }} />

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1e1e1e', height: '48px',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 32px',
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span style={{ color: '#00d4ff' }}>Job</span>
            <span style={{ color: '#e0e0e0' }}>Feed</span>
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '6px 16px', background: 'transparent',
                border: '1px solid #1e1e1e', color: '#555', cursor: 'pointer',
                fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', ...mono,
                transition: 'border-color 0.1s, color 0.1s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}
              >
                Sign in
              </button>
            </Link>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '6px 16px', background: '#00d4ff',
                border: 'none', color: '#000', cursor: 'pointer',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', ...mono,
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.background = '#00d4ff')}
              >
                Get started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '160px 32px 140px', maxWidth: '1100px', margin: '0 auto' }}
        className="animate-fade-in">
        <div style={{ maxWidth: '720px' }}>
          {/* Tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#00d4ff', border: '1px solid rgba(0,212,255,0.4)',
            padding: '4px 12px', marginBottom: '28px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d4ff' }} className="animate-pulse-cyan" />
            AI-Powered Job Discovery
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 700, lineHeight: 1.08,
            letterSpacing: '-0.02em', color: '#fff',
            marginBottom: '20px',
          }}>
            Your dream job,<br />
            <span style={{ color: '#00d4ff' }}>delivered daily.</span>
          </h1>

          <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.85, maxWidth: '540px', marginBottom: '36px' }}>
            JobFeed uses AI to match your skills and preferences with thousands of fresh jobs —
            then sends the best ones straight to your inbox every morning.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', background: '#00d4ff',
                border: 'none', color: '#000', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', ...mono,
                transition: 'background 0.1s, box-shadow 0.1s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,212,255,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#00d4ff'; e.currentTarget.style.boxShadow = 'none' }}
              >
                Start for free <ArrowRight size={14} />
              </button>
            </Link>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', background: 'transparent',
                border: '1px solid #1e1e1e', color: '#888', cursor: 'pointer',
                fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', ...mono,
                transition: 'border-color 0.1s, color 0.1s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.color = '#00d4ff' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#888' }}
              >
                Sign in
              </button>
            </Link>
          </div>

          {/* Trust */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {TRUST.map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#555' }}>
                <CheckCircle size={12} color="#00ff88" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Mock email card ── */}
        <div style={{
          marginTop: '64px',
          background: '#111', border: '1px solid #1e1e1e',
          borderTop: '2px solid #00d4ff',
          maxWidth: '580px',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 20px', background: '#0a0a0a',
            borderBottom: '1px solid #1e1e1e',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#333' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#333' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#333' }} />
            <span style={{ marginLeft: '10px', fontSize: '11px', color: '#555', letterSpacing: '0.05em' }}>
              📧 Your Daily Job Digest — 10 new matches
            </span>
          </div>

          {/* Jobs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#1e1e1e', padding: '0' }}>
            {MOCK_JOBS.map((job, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', background: '#111',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0', marginBottom: '3px' }}>{job.title}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>{job.company} · {job.loc}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#e0e0e0', marginBottom: '3px' }}>{job.salary}</div>
                  <div style={{
                    fontSize: '9px', padding: '2px 8px',
                    background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
                    color: '#00d4ff', letterSpacing: '0.12em',
                  }}>
                    {job.match}% match
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#333', letterSpacing: '0.1em' }}>+ 7 more matches</span>
            <span style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.1em' }}>View all →</span>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{
        borderTop: '1px solid #1e1e1e', borderBottom: '1px solid #1e1e1e',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0', background: '#1e1e1e',
        }}>
          {STATS.map(({ value, label }) => (
            <div key={label} style={{
              padding: '28px 24px', background: '#000',
              borderRight: '1px solid #1e1e1e',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#00d4ff', marginBottom: '6px' }}>{value}</div>
              <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 32px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '12px' }}>
            // features
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            Everything you need,<br />nothing you don't.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#1e1e1e' }}>
          {FEATURES.map(({ idx, icon: Icon, title, desc }) => (
            <div key={idx} style={{
              background: '#111', padding: '24px',
              borderLeft: '2px solid transparent', transition: 'border-color 0.1s, background 0.1s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderLeftColor = '#00d4ff'; (e.currentTarget as HTMLDivElement).style.background = '#0d0d0d' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent'; (e.currentTarget as HTMLDivElement).style.background = '#111' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.12em' }}>{idx}</span>
                <Icon size={14} color="#00d4ff" />
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0', marginBottom: '8px' }}>{title}</h3>
              <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.8 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{
        position: 'relative', zIndex: 1, padding: '80px 32px',
        borderTop: '1px solid #1e1e1e', borderBottom: '1px solid #1e1e1e',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '12px' }}>
              // how_it_works
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              Up and running in minutes.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#1e1e1e' }}>
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} style={{ background: '#111', padding: '24px' }}>
                <div style={{
                  fontSize: '24px', fontWeight: 700, color: '#00d4ff',
                  opacity: 0.3, marginBottom: '16px', letterSpacing: '-0.02em',
                }}>
                  {step}
                </div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0', marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '11px', color: '#555', lineHeight: 1.8 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 32px' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          background: '#111', border: '1px solid #1e1e1e',
          borderTop: '2px solid #00d4ff', padding: '48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '32px',
        }}>
          <div>
            <div style={{ fontSize: '10px', color: '#00d4ff', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px' }}>
              // get_started
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px', letterSpacing: '-0.01em' }}>
              Ready to find your next role?
            </h2>
            <p style={{ fontSize: '12px', color: '#555' }}>
              Free forever. No credit card required. Setup takes 3 minutes.
            </p>
          </div>
          <Link to="/signup" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 32px', background: '#00d4ff',
              border: 'none', color: '#000', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', ...mono,
              transition: 'background 0.1s',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#00d4ff')}
            >
              Start for free <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid #1e1e1e', padding: '24px 32px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span style={{ color: '#00d4ff' }}>Job</span>
            <span style={{ color: '#333' }}>Feed</span>
          </span>
          <span style={{ fontSize: '10px', color: '#333', letterSpacing: '0.08em' }}>
            © 2025 JobFeed — Daily job intelligence
          </span>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{
                fontSize: '10px', color: '#333', textDecoration: 'none',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'color 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#00d4ff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#333')}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}