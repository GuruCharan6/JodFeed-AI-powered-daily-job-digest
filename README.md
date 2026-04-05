<div align="center">

# JobDigest

**Your personalized daily job digest — AI-matched and delivered at exactly your time.**

[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat-square)](https://groq.com)
[![Resend](https://img.shields.io/badge/Email-Resend-000000?style=flat-square)](https://resend.com)
[![Vercel](https://img.shields.io/badge/Hosted-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

🌐 **[jobdigest.site](https://jobdigest.site)**

</div>

---

## About

JobDigest is an AI-powered job matching platform that replaces endless job board scrolling with a curated daily email. Users set up their profile through an onboarding wizard — skills, target roles, preferred locations, company types, and experience level — and receive a ranked list of the best matching jobs in their inbox every day at their chosen time.

The backend uses Groq (LLaMA 3.3 70B) to score each job against the user's profile, and the scheduler ensures emails arrive at the exact hour and minute the user selects.

---

## Features

- **AI-powered resume parsing** — Upload a PDF and AI extracts skills, roles, and locations automatically
- **Multi-step onboarding wizard** — Choose resume upload or manual entry, then configure skills, roles, locations, company preferences, digest schedule, and experience level
- **Smart job aggregation** — Collapses user profiles into unique combinations to minimize API calls; deduplicates via MD5 hash; caches jobs for 6–24 hours
- **AI match scoring** — Groq LLaMA 3.3 70B scores every job 0–100 based on title, skill overlap, location match, and experience-level weighting
- **Scheduled daily email** — APScheduler ticks every minute; jobs are fetched 5 min ahead of send time and the process sleeps until the user's exact chosen time
- **Dark-themed HTML email** — Per-job match scores with colored labels (STRONG / GOOD / WEAK) and direct apply links
- **Interactive dashboard** — View and edit profile sections (skills, roles, locations, companies, experience level, digest time) via modal editors with optimistic updates and rollback on failure
- **Digest toggle** — Pause or resume email delivery without losing profile configuration
- **AI insights panel** — Dynamic profile analysis showing match stats, remote opportunity multiplier, and digest status
- **Authentication** — Email/password + Google OAuth via Supabase Auth, with password reset flow
- **Liquid glass UI** — Dark theme with glass-morphic cards, animated scroll reveals, and consistent design system across all pages

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript 5.2 + Vite 5 |
| **Styling** | Tailwind CSS 3.3 + custom CSS variables (shadcn-style tokens) + Geist Sans |
| **UI** | Lucide React icons, react-hook-form + Zod validation, react-hot-toast, zustand state management |
| **Routing** | React Router v6 |
| **Backend** | FastAPI (Python 3.11+) + Uvicorn + APScheduler |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email + Google OAuth) |
| **Job source** | JSearch API (RapidAPI) |
| **AI scoring** | Groq — LLaMA 3.3 70B |
| **Resume parsing** | pypdf + Groq AI extraction |
| **Email** | Resend with custom HTML templates |
| **Deployment** | Vercel |

---

## Project Structure

```
JobDigest/
├── frontend/                    # React SPA — Vite + TypeScript
│   ├── src/
│   │   ├── api/                 # API client (axios) and Supabase helpers
│   │   │   ├── axiosClient.ts   # Axios instance with auth interceptor
│   │   │   ├── auth.ts          # Sign up/in, Google OAuth, password reset
│   │   │   └── profile.ts       # Profile CRUD + resume upload
│   │   ├── components/
│   │   │   ├── layout/          # Navbar, ProtectedRoute
│   │   │   ├── onboarding/      # Wizard shell + 7 setup steps
│   │   │   └── ui/              # Button, Input, Badge, Toast primitives
│   │   ├── pages/               # Landing, Auth, Onboarding, Dashboard
│   │   ├── store/               # zustand auth store
│   │   ├── utils/               # Supabase client
│   │   ├── App.tsx              # Router + auth listener
│   │   └── index.css            # Tailwind + CSS variables + liquid glass
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/                     # FastAPI Python application
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint, router mounting, shutdown
│   │   ├── config.py            # Pydantic Settings (env vars)
│   │   ├── database.py          # Supabase PostgREST client
│   │   ├── dependencies.py      # FastAPI DI (current user, Supabase auth)
│   │   ├── routers/
│   │   │   ├── profile.py       # GET/PATCH profile, resume upload endpoint
│   │   │   └── resume.py        # Resume PDF parsing via pypdf + Groq
│   │   ├── services/
│   │   │   ├── aggregator.py    # Collapses profiles, fetches jobs, caches
│   │   │   ├── scorer.py        # Sends batched jobs to Groq for scoring
│   │   │   ├── mailer.py        # Builds and sends HTML digest via Resend
│   │   │   ├── jsearch.py       # JSearch API client (RapidAPI)
│   │   │   ├── cleanup.py       # Post-send jobs table cleanup
│   │   │   └── config.py
│   │   └── tasks/
│   │       └── cron.py          # APScheduler per-minute digest trigger
│   ├── requirements.txt         # All Python dependencies
│   └── .env.example             # Required env vars
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- A [Supabase](https://supabase.com) project
- A [RapidAPI](https://rapidapi.com) account with JSearch subscribed
- A [Groq](https://groq.com) API key
- A [Resend](https://resend.com) account with a verified sending domain

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

```bash
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
JSEARCH_API_KEY=your_rapidapi_key
GROQ_API_KEY=your_groq_key
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=digest@yourdomain.com
```

```bash
uvicorn app.main:app --reload
```

### Required Database Migration

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS combo_key text;
CREATE INDEX IF NOT EXISTS jobs_combo_key_idx ON jobs(combo_key);
```

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase public anon key |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend | Service role key — bypasses RLS |
| `JSEARCH_API_KEY` | Backend | RapidAPI key for JSearch |
| `GROQ_API_KEY` | Backend | Groq API key for AI resume parsing and job scoring |
| `RESEND_API_KEY` | Backend | Resend API key for email delivery |
| `EMAIL_FROM` | Backend | Sender email address (e.g. `digest@jobdigest.site`) |

---

## License

MIT — free to fork and build on.
