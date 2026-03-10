Job Feed

**AI-powered daily job digest — personalized, scored, and delivered at exactly your time.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat-square)](https://groq.com)
[![Resend](https://img.shields.io/badge/Email-Resend-000000?style=flat-square)](https://resend.com)

</div>

---

## What is JobFeed?

JobFeed fetches jobs from across the web, scores every listing against your profile using AI, and sends a curated digest to your inbox at **exactly the time you set** — every single day.

No job boards. No scrolling. Just the top matches, ranked and delivered.

---

## ✨ Features

- **⚡ Precision scheduling** — digest fires at the exact minute you set, guaranteed, using a 5-minute aggregation lead-time pipeline
- **🤖 AI job scoring** — every job scored 0–100 against your skills, roles, and experience level using LLaMA 3.3 70B via Groq
- **🔍 Smart aggregation** — JSearch API called once per unique (role, location, level) combo across ALL users — shared cache eliminates redundant calls
- **🎓 Experience-aware** — fresher / junior / mid / senior / expert modes with tailored search queries, filters, and email badges
- **📧 Beautiful email digest** — dark-themed, monospace email matching the dashboard aesthetic, with scored job cards and match labels
- **🎛️ Full dashboard** — manage skills, roles, locations, company preferences, digest time, and on/off toggle
- **🏢 Company filtering** — match by MNC, startup, remote-first, government, or NGO preference
- **📍 Multi-location** — track jobs across multiple cities and remote simultaneously
- **🔁 Duplicate prevention** — MD5 dedup hash on title+company+location prevents the same job appearing twice
- **📋 Digest logs** — every send logged to `digest_logs` table with status, duration, and job count

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CRON (every minute)                   │
│                                                               │
│  Tick → "Who needs aggregation to start RIGHT NOW?"          │
│       → Users whose digest_time is exactly 5 min away        │
│                          │                                    │
│              ┌───────────▼────────────┐                      │
│              │      AGGREGATOR        │                      │
│              │                        │                      │
│              │  All profiles          │                      │
│              │    → unique combos     │                      │
│              │    → cache check       │                      │
│              │    → JSearch (if stale)│                      │
│              │    → upsert to DB      │                      │
│              └───────────┬────────────┘                      │
│                          │  jobs in DB                       │
│              ┌───────────▼────────────┐                      │
│              │   asyncio.gather()     │                      │
│              │   (per user, parallel) │                      │
│              │                        │                      │
│              │  sleep until HH:MM     │                      │
│              │    → filter jobs       │                      │
│              │    → SCORER (Groq AI)  │                      │
│              │    → MAILER (Resend)   │                      │
│              │    → log to digest_logs│                      │
│              └───────────┬────────────┘                      │
│                          │                                    │
│              ┌───────────▼────────────┐                      │
│              │   CLEANUP              │                      │
│              │   delete jobs table    │                      │
│              └────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```
---

## 🖥️ Tech Stack

### Frontend
| | |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | JetBrains Mono, inline styles, dark theme |
| State management | Zustand |
| Auth | Supabase Auth |
| HTTP client | Axios |

### Backend
| | |
|---|---|
| API framework | FastAPI (Python 3.11+) |
| Database | Supabase (PostgreSQL) |
| Job source | JSearch API via RapidAPI |
| AI scoring | Groq — LLaMA 3.3 70B Versatile |
| Email delivery | Resend |
| Scheduler | APScheduler (AsyncIOScheduler) |
| Timezone | Asia/Kolkata (IST) |

---

## 📁 Project Structure

```
jobfeed/
│
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── axiosClient.ts         # base axios instance
│       │   ├── auth.ts                # login / signup / logout
│       │   └── profile.ts             # getProfile / saveProfile / uploadResume
│       │
│       ├── pages/
│       │   ├── LandingPage.tsx        # public homepage
│       │   ├── LoginPage.tsx
│       │   ├── SignupPage.tsx
│       │   ├── AuthCallbackPage.tsx   # OAuth redirect handler
│       │   ├── OnboardingPage.tsx     # multi-step wizard shell
│       │   └── DashboardPage.tsx      # main user dashboard
│       │
│       ├── components/
│       │   └── onboarding/
│       │       ├── WizardShell.tsx
│       │       ├── Step0Method.tsx    # resume upload or manual
│       │       ├── Step1Resume.tsx
│       │       ├── Step2Skills.tsx
│       │       ├── Step3Roles.tsx
│       │       ├── Step4Location.tsx
│       │       ├── Step5Companies.tsx
│       │       ├── Step6Schedule.tsx  # digest time picker
│       │       └── Step7Experience.tsx
│       │
│       ├── store/
│       │   └── authstore.ts           # Zustand auth state
│       │
│       └── utils/
│           └── supabase.ts            # createClient
│
└── backend/
    └── app/
        ├── main.py                    # FastAPI app + scheduler startup
        ├── config.py                  # get_settings() — env vars
        ├── database.py                # admin Supabase client
        │
        └── services/
            ├── aggregator.py          # job fetching, caching, deduplication
            ├── scorer.py              # Groq AI scoring (batched)
            ├── mailer.py              # HTML email builder + Resend sender
            ├── jsearch.py             # JSearch API client
            ├── cron.py                # APScheduler pipeline + per-user sends
            └── cleanup.py             # post-send jobs table cleanup
```

---

## ⏱️ Scheduling Deep Dive

The scheduler ticks **every minute** and never misses a digest time, regardless of when the server started.

```
Timeline example — user sets digest_time = "20:28"

20:23:00  Tick fires
          → detects 20:28 is exactly 5 min away (within ±30s window)
          → adds user to _active_pipelines (prevents double-trigger)
          → starts aggregator immediately

20:23:xx  Aggregator runs
          → checks cache per combo
          → calls JSearch only for stale combos
          → upserts jobs to DB

20:23:xx  asyncio.sleep(sleep_secs) for each user
          → each user sleeps independently to their exact time

20:28:00  Sleep ends
          → filter + score + send for this user
          → log result to digest_logs

20:28:xx  Cleanup: delete jobs table
          → _active_pipelines removes key
```

**Key guarantees:**
- `_active_pipelines` set prevents double-sending if a tick overlaps
- `±30s` tolerance handles tick jitter
- `max_instances=10` allows up to 10 concurrent pipeline slots
- DB reconnect with exponential backoff on transient Supabase errors

---

## 🗄️ Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Auth user ID |
| `email` | text | |
| `full_name` | text | |
| `skills` | text[] | `["Python", "React"]` |
| `target_roles` | text[] | `["AI Engineer", "ML Engineer"]` |
| `locations` | text[] | `["Bangalore", "Hyderabad"]` |
| `remote` | boolean | Open to remote |
| `company_pref` | text[] | `mnc` / `startup` / `remote` / `govt` / `ngo` |
| `years_of_experience` | numeric | 0 = fresher |
| `is_fresher` | boolean | |
| `experience_level` | text | `fresher` / `junior` / `mid` / `senior` / `expert` |
| `digest_enabled` | boolean | Toggle on/off |
| `digest_time` | time | `09:00:00` |
| `resume_url` | text | |
| `resume_filename` | text | |
| `onboarding_complete` | boolean | |

### `jobs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Auto |
| `title` | text | |
| `company` | text | |
| `location` | text | |
| `description` | text | First 600 chars |
| `apply_url` | text | |
| `source` | text | `jsearch` |
| `dedup_hash` | text | MD5 of `title\|company\|location` — unique constraint |
| `combo_key` | text | `role\|location\|level` — used for per-user cache filtering |
| `company_type` | text | `mnc` / `startup` / `product` / `other` |
| `experience_required` | text | Min years extracted from description |
| `is_entry_level` | boolean | Detected from keywords |
| `scraped_at` | timestamptz | Fetch time |
| `expires_at` | timestamptz | 7 days after scrape |

### `digest_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Auto |
| `user_id` | uuid | FK to profiles |
| `user_email` | text | |
| `jobs_sent` | int | |
| `status` | text | `sent` / `failed` |
| `error` | text | Error message if failed |
| `sent_at` | timestamptz | |
| `experience_level` | text | |
| `is_fresher` | boolean | |
| `roles_searched` | text[] | |
| `duration_seconds` | int | Aggregation → send time |

**Required migration:**
```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS combo_key text;
CREATE INDEX IF NOT EXISTS jobs_combo_key_idx ON jobs(combo_key);
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase project
- RapidAPI account (JSearch)
- Groq API key
- Resend account + verified domain

### 1. Clone

```bash
git clone https://github.com/yourusername/jobfeed.git
cd jobfeed
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

**`frontend/.env`**
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

```bash
npm run dev   # http://localhost:5173
```

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

**`backend/.env`**
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
JSEARCH_API_KEY=your_rapidapi_key
GROQ_API_KEY=your_groq_key
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=digest@yourdomain.com
```

```bash
uvicorn app.main:app --reload   # http://localhost:8000
```

### 4. Trigger a digest manually

```bash
curl -X POST http://localhost:8000/cron/digest
```

---

## 🔑 Environment Variables

| Variable | Used in | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon key |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend | Service role key (bypasses RLS) |
| `JSEARCH_API_KEY` | Backend | RapidAPI key for JSearch |
| `GROQ_API_KEY` | Backend | Groq API key |
| `RESEND_API_KEY` | Backend | Resend API key |
| `EMAIL_FROM` | Backend | Sender address e.g. `digest@jobfeed.site` |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to fork, modify, and build on top of.

