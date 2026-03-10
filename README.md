<div align="center">

# ⚡ JobFeed

**Your personalized daily job digest — AI-matched and delivered at exactly your time.**

[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat-square)](https://groq.com)
[![Resend](https://img.shields.io/badge/Email-Resend-000000?style=flat-square)](https://resend.com)

</div>

---

## What is JobFeed?

You tell JobFeed your skills, the roles you want, your location, and what time you want your email. Every day at that exact time, JobFeed fetches real job listings, scores each one against your profile using AI, and sends you only the top matches — ranked best to worst.

No job boards. No scrolling. Just your top matches, in your inbox, every day.

---

## How It Works

### 1. You set up your profile
During onboarding you enter your skills, target job titles, preferred cities, company type (MNC / startup / remote / govt), years of experience, and the exact time you want your daily email.

### 2. Every minute, the scheduler checks
A background job ticks every minute and asks: *"Is anyone's digest time exactly 5 minutes away?"*

If yes — it starts the pipeline for those users right now, giving a 5-minute head start before the email needs to send.

### 3. The aggregator fetches jobs (smartly)
Instead of fetching jobs separately for every user, JobFeed collapses all user profiles into a set of unique combinations — for example `(AI Engineer, Bangalore, fresher)`. If 100 users all want the same role in the same city, that's **1 API call**, not 100.

Before calling the API at all, it checks the cache:
- Jobs fetched **less than 6 hours ago** → skip, use what's already in the database
- Jobs fetched **6–24 hours ago with 10+ results** → skip
- Jobs **older than 24 hours or fewer than 10 results** → fetch fresh

This keeps API usage low even as the user base grows.

### 4. Every job gets an AI score
Once jobs are in the database, each user's jobs are pulled and sent to Groq (LLaMA 3.3 70B) which scores every listing from 0–100 based on:
- How well the job title matches what you're looking for
- How many of your skills appear in the description
- Whether the location matches
- Your experience level (freshers get entry-level boosting, seniors get senior-role weighting)

Jobs are sent to the AI in batches of 25 to keep it fast and reliable.

### 5. The email sends at your exact time
After scoring, the top 20 jobs are picked and a dark-themed HTML email is built — with each job card showing the match score, a colored label (STRONG / GOOD / WEAK match), and a direct apply link. The email sends via Resend at the exact minute you chose.

### 6. Cleanup
After all emails for a given time slot are sent, the jobs table is cleared. Fresh jobs are fetched the next day.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | FastAPI (Python 3.11+) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Job source | JSearch API (RapidAPI) |
| AI scoring | Groq — LLaMA 3.3 70B |
| Email | Resend |
| Scheduler | APScheduler — ticks every minute |

---

## Getting Started

### What you need
- Node.js 18+ and Python 3.11+
- A [Supabase](https://supabase.com) project
- A [RapidAPI](https://rapidapi.com) account with JSearch subscribed
- A [Groq](https://groq.com) API key
- A [Resend](https://resend.com) account with a verified sending domain

### Frontend setup

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

### Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
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
---

## Scheduling — How It Never Misses Your Time

The scheduler doesn't run once a day at a fixed time. It ticks **every minute**, which means it works correctly no matter when the server starts or restarts.

Here's a concrete example. Say you set your digest time to `20:28`.

```
20:23:00  → Scheduler tick fires
           → Sees that 20:28 is exactly 5 minutes away
           → Marks you as "in progress" to prevent duplicate runs
           → Aggregator starts immediately

20:23–28  → Jobs are fetched (or served from cache)
           → Stored in database
           → Your user process sleeps until 20:28:00

20:28:00  → Sleep ends
           → Your jobs are scored by AI
           → Email is built and sent via Resend
           → Result logged to digest_logs table

20:28:xx  → Jobs table is cleared
           → Your pipeline slot is freed
```

Multiple users with different digest times all run through this same flow concurrently — each one sleeping to their own exact send time after aggregation completes.

---

## Database Tables

**`profiles`** — one row per user. Stores skills, roles, locations, experience level, digest time, and whether the digest is enabled.

**`jobs`** — populated fresh each day by the aggregator. Each job has a `dedup_hash` (MD5 of title + company + location) to prevent duplicates, and a `combo_key` (role + location + level) so each user only scores the jobs relevant to them.

**`digest_logs`** — every email send is recorded here with status, job count, experience level, and how long the pipeline took. Useful for debugging and monitoring.

---

### One required database migration

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS combo_key text;
CREATE INDEX IF NOT EXISTS jobs_combo_key_idx ON jobs(combo_key);
```


## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (frontend) |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key (frontend) |
| `SUPABASE_URL` | Supabase project URL (backend) |
| `SUPABASE_SERVICE_KEY` | Service role key — bypasses RLS (backend) |
| `JSEARCH_API_KEY` | RapidAPI key for JSearch |
| `GROQ_API_KEY` | Groq API key for LLaMA scoring |
| `RESEND_API_KEY` | Resend API key for email delivery |
| `EMAIL_FROM` | Sender address e.g. `digest@jobfeed.site` |

---

## License

MIT — free to fork and build on.

