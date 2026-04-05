import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Mail, Brain, MapPin, Clock, CheckCircle2,
  BarChart3, FileSearch, Sparkles, Zap, Shield, TrendingUp,
  Building2, GraduationCap, Briefcase, Star
} from 'lucide-react'

// ── DATA ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Brain,     title: 'AI-Powered Matching',   desc: 'AI reads your entire profile — skills, roles, experience — and finds jobs that actually match.' },
  { icon: Mail,      title: 'Inbox Delivery',          desc: 'Curated digest of top matching jobs delivered daily. Never search boards again.' },
  { icon: MapPin,    title: 'Multi-Location',          desc: 'Set up to 5 preferred cities plus remote. Opportunities across markets.' },
  { icon: Clock,     title: 'Your Schedule',           desc: 'Pick exactly when you want your digest — 7 AM, 9 AM, or any custom time.' },
  { icon: BarChart3, title: 'Smart Filtering',         desc: 'Filter by MNCs, startups, remote-first, government — only companies you care about.' },
  { icon: FileSearch,title: 'Resume Parsing',          desc: 'Upload your PDF once. AI extracts skills and roles automatically. Review and confirm.' },
]

const HOW_IT_WORKS = [
  { step: '01', icon: FileSearch,   title: 'Upload resume',        desc: 'Upload your resume or fill your profile manually. Takes under 3 minutes.' },
  { step: '02', icon: Brain,       title: 'AI organizes profile',   desc: 'AI extracts skills, roles, and preferences. You review and confirm.' },
  { step: '03', icon: Clock,       title: 'Set your schedule',      desc: 'Choose when you want your daily digest — morning, noon, or evening.' },
  { step: '04', icon: Mail,        title: 'Jobs in your inbox',     desc: 'Wake up to a curated list of the best matching jobs every single day.' },
]

const STATS = [
  { value: '50K+',   label: 'Jobs indexed daily',    icon: BarChart3 },
  { value: '98%',    label: 'Delivery rate',         icon: Mail },
  { value: '< 3min', label: 'Setup time',            icon: Clock },
  { value: '10x',    label: 'More relevant results', icon: TrendingUp },
]

const TRUST = ['Free to use', 'No spam ever', 'Setup in 3 minutes', 'Cancel anytime']

const MOCK_JOBS = [
  { title: 'Senior React Developer', company: 'Razorpay',  loc: 'Bangalore · Remote', salary: '₹25–40 LPA', match: '98', type: 'MNC' },
  { title: 'Full Stack Engineer',    company: 'Zepto',     loc: 'Mumbai',             salary: '₹18–28 LPA', match: '95', type: 'Startup' },
  { title: 'Frontend Lead',          company: 'Groww',     loc: 'Bangalore',          salary: '₹30–45 LPA', match: '92', type: 'Startup' },
  { title: 'Software Engineer',      company: 'Microsoft', loc: 'Hyderabad',          salary: '₹35–55 LPA', match: '89', type: 'MNC' },
]

const COMPANIES_LOGOS = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Infosys', 'TCS', 'Accenture']

const TESTIMONIALS = [
  { name: 'Priya Sharma',     role: 'React Developer',        text: 'Got 3 interviews in my first week. The matches are surprisingly accurate — every job actually aligned with my skills.', company: 'Joined via JobDigest' },
  { name: 'Arjun Mehta',      role: 'Full Stack Engineer',     text: 'I stopped scrolling through job boards entirely. My morning digest has everything I need, filtered to roles I actually want.', company: 'Joined via JobDigest' },
  { name: 'Neha Reddy',       role: 'Frontend Architect',     text: 'Setting my schedule and locations took 2 minutes. Now I get curated jobs for Bangalore and remote — zero noise.', company: 'Joined via JobDigest' },
]

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-5"
      style={{ transition: 'opacity 500ms ease-out, transform 500ms ease-out', transitionDelay: visible ? `${delay}ms` : '0ms', ...(visible ? { opacity: 1, transform: 'translateY(0)' } : {}) }}
    >
      {children}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 liquid-glass">
        <div className="max-w-[1100px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-[-0.02em] text-primary no-underline">
            Job<span className="text-foreground">Digest</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/login" className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Sign in
            </Link>
            <Link to="/signup" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-primary bg-primary/15 border border-primary/30 rounded-lg hover:bg-primary/25 transition-colors cursor-pointer">
              Get started
            </Link>
          </div>
        </div>
        <div className="gradient-divider" />
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-20 pb-16 md:pt-32 md:pb-24 px-4 md:px-6">
        {/* Background radial blob */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--primary) / 0.2), transparent)' }}
        />

        <div className="max-w-[720px] mx-auto text-center relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-full mb-6">
            <Sparkles size={13} />
            AI-Powered Job Matching
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-[-0.024em] text-gradient-hero mb-4 md:mb-6">
            Your dream job,<br />delivered daily.
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
            Upload your resume. AI learns your skills. Get a curated digest of the best matching jobs in your inbox every morning.
          </p>

          {/* CTAs */}
          <div className="flex gap-3 justify-center flex-wrap mb-6">
            <Link to="/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-150 shadow-[0_0_20px_hsl(var(--primary)/0.3)] cursor-pointer">
              Start for free <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 liquid-glass text-foreground px-7 py-3 rounded-full hover:bg-white/5 transition-all duration-150 cursor-pointer">
              Sign in
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 justify-center">
            {TRUST.map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <CheckCircle2 size={13} className="text-emerald-400" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOCK EMAIL (Show don't tell) ──────────────────────────────────── */}
      <ScrollReveal delay={200}>
        <section className="px-4 md:px-6 pb-20">
          <div className="max-w-[640px] mx-auto">
            <div className="bg-card/80 border border-border rounded-xl overflow-hidden">
              {/* Fake email header */}
              <div className="px-5 py-3.5 bg-secondary/50 border-b border-border flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                <span className="ml-2 text-xs text-muted-foreground font-medium tracking-wide">
                  Your Daily Job Digest — 10 new matches
                </span>
              </div>

              {/* Jobs */}
              <div className="flex flex-col">
                {MOCK_JOBS.map((job, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 gap-3 border-b border-border/50 last:border-b-0 hover:bg-secondary/20 transition-colors duration-100 cursor-pointer">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground mb-0.5 truncate">{job.title}</div>
                      <div className="text-xs text-muted-foreground">{job.company} · {job.loc}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold text-foreground mb-1">{job.salary}</div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full">
                        {job.match}% match
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3.5 border-t border-border bg-secondary/30 flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">+ 6 more matches</span>
                <span className="text-xs text-primary font-semibold">View all →</span>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-y border-border/50 bg-card/50">
          <div className="max-w-[1100px] mx-auto px-4 md:px-6 grid grid-cols-2 lg:grid-cols-4">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="py-8 md:py-10 text-center flex flex-col items-center gap-2">
                {/* Removed divider lines, added icon */}
                <Icon size={18} className="text-primary/60 mb-1" />
                <div className="text-3xl lg:text-4xl font-bold text-primary tracking-[-0.02em]">{value}</div>
                <div className="text-xs text-muted-foreground font-medium">{label}</div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="border-y border-border/50 bg-card/30 py-20 md:py-24 px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 max-w-[480px]">
              <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Features</div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.03em] mb-2">
                Everything you need
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Powerful features to streamline your job search.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="liquid-glass rounded-xl p-6 transition-all duration-150 cursor-default">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── VALUE PROPS (Why JobDigest) ─────────────────────────────────────── */}
      <ScrollReveal>
        <section className="relative z-10 py-20 md:py-24 px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 max-w-[480px]">
              <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">Why JobDigest</div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-[-0.03em] mb-2">
                Built for serious candidates
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Zap, title: 'Stop scrolling boards', desc: 'Jobs come to you. No more refreshing portals, no missed deadlines. A fresh digest every day at your chosen time.' },
                { icon: Shield, title: 'Privacy first', desc: 'Your resume is parsed server-side and never shared with recruiters. You control who sees your profile.' },
                { icon: GraduationCap, title: 'For every level', desc: 'Fresh graduate or 15-year veteran — AI calibrates seniority, compensation, and role fit automatically.' },
                { icon: Briefcase, title: 'Quality over quantity', desc: 'We index 50K+ jobs but only send your top 5-10 matches. Every job is relevant to your profile.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-5 rounded-xl border border-border/50 bg-card/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <ScrollReveal>
        <section className="relative z-10 py-20 px-4 md:px-6">
          <div className="max-w-2xl mx-auto relative overflow-hidden">
            {/* Glow behind card */}
            <div className="absolute -inset-8 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            {/* Card */}
            <div className="relative liquid-glass rounded-2xl px-8 md:px-10 py-10 md:py-12 text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 tracking-[-0.02em] leading-tight">
                Ready to find your next role?
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md mx-auto">
                Free forever. No credit card required. Setup takes under 3 minutes.
              </p>
              <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:bg-primary/90 transition-all duration-150 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_32px_hsl(var(--primary)/0.5)] cursor-pointer">
                Start for free <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4 md:px-6 relative z-10">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-[-0.02em]">
            <span className="text-primary">Job</span><span className="text-foreground">Digest</span>
          </span>
          <span className="text-xs text-muted-foreground">
            © 2026 JobDigest — Daily job intelligence
          </span>
        </div>
      </footer>
    </div>
  )
}
