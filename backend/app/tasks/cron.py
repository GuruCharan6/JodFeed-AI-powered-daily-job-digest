"""
cron.py — DB-synced digest scheduler

Timing guarantee (regardless of when server started):
  - Scheduler ticks every minute using CronTrigger(minute="*")
  - Each tick checks: "is any user's digest_time exactly 5 minutes from now?"
  - If yes → start aggregation immediately (providing the 5-min lead)
  - After aggregation → sleep until user's exact digest_time → send

Example: user sets digest_time = "20:28"
  - Tick fires at 20:23:00 → detects 20:28 is exactly 5 min away
  - Aggregation starts at 20:23
  - Email sends at exactly 20:28:00
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.services.aggregator import run_aggregator
from app.services.scorer import score_jobs
from app.services.mailer import send_digest
from app.services.cleanup import delete_all_jobs_immediate
from app.database import admin, get_admin_client

import asyncio
import time
import traceback
from datetime import datetime, timedelta
import pytz

# ── Config ────────────────────────────────────────────────────────────────────

TIMEZONE      = pytz.timezone("Asia/Kolkata")
PIPELINE_LEAD = 5        # minutes before digest_time to start aggregation
DEFAULT_TIME  = "19:00"  # fallback if profile has no digest_time

scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

# Track in-progress pipelines to avoid double-triggering
_active_pipelines: set[str] = set()   # keyed by "email|HH:MM"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize_pref(pref) -> list[str]:
    if not pref:
        return ["all"]
    if isinstance(pref, str):
        return [pref]
    if isinstance(pref, list):
        normalized = []
        for item in pref:
            if isinstance(item, str):
                normalized.append(item)
            elif isinstance(item, dict):
                val = item.get("value") or item.get("label") or item.get("name") or ""
                if val:
                    normalized.append(str(val))
        return normalized or ["all"]
    return ["all"]


def _execute_with_retry(table_op, max_retries=3):
    """Execute Supabase operation with retry + reconnect on transient errors."""
    for attempt in range(max_retries):
        try:
            return table_op.execute()
        except Exception as e:
            error_str = str(e)
            if any(x in error_str for x in ("RemoteProtocolError", "ConnectionTerminated", "ReadTimeout")):
                print(f"DB connection error (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(1 * (attempt + 1))
                    global admin
                    admin = get_admin_client()
                    continue
            raise
    return None


def _get_years(profile: dict) -> int:
    yoe = profile.get("years_of_experience")
    if yoe is not None:
        return int(yoe)
    return 0


def _get_experience_level(years: int) -> str:
    if years == 0:   return "fresher"
    if years <= 2:   return "junior"
    if years <= 5:   return "mid"
    if years <= 10:  return "senior"
    return "expert"


def _parse_digest_time(profile: dict) -> str:
    """Return 'HH:MM' from profile, falling back to DEFAULT_TIME."""
    t = profile.get("digest_time") or DEFAULT_TIME
    return t[:5]  # handles both 'HH:MM' and 'HH:MM:SS'


def _get_digest_dt(profile: dict, reference: datetime) -> datetime:
    """
    Return a timezone-aware datetime for this profile's digest_time today.
    If that time has already passed today, return tomorrow's occurrence.
    """
    hhmm = _parse_digest_time(profile)
    try:
        h, m = map(int, hhmm.split(":"))
    except ValueError:
        h, m = 19, 0

    dt = reference.replace(hour=h, minute=m, second=0, microsecond=0)
    if dt < reference:
        dt += timedelta(days=1)
    return dt


def _profiles_due_at_lead(profiles: list[dict], now: datetime) -> list[dict]:
    """
    Return profiles whose digest_time is exactly PIPELINE_LEAD minutes from now
    (within a +/-30 second tolerance to handle tick jitter).

    e.g. now=20:23:05, PIPELINE_LEAD=5 -> target=20:28:05
    Matches any profile with digest_time in [20:27:35, 20:28:35)
    """
    target     = now + timedelta(minutes=PIPELINE_LEAD)
    tolerance  = timedelta(seconds=30)
    window_low = target - tolerance
    window_hi  = target + tolerance

    due = []
    for profile in profiles:
        digest_dt = _get_digest_dt(profile, now)

        if window_low <= digest_dt <= window_hi:
            # Deduplicate: skip if a pipeline is already running for this slot
            key = f"{profile.get('email')}|{_parse_digest_time(profile)}"
            if key in _active_pipelines:
                print(f"[cron] Skipping {profile.get('email')} — pipeline already running")
                continue

            profile["_digest_dt"]    = digest_dt
            profile["_pipeline_key"] = key
            due.append(profile)

    return due


# ── Per-user send ─────────────────────────────────────────────────────────────

async def _send_for_user(profile: dict, all_jobs: list[dict]):
    """Score jobs and send digest for a single user."""
    user_id    = str(profile.get("id", ""))
    user_email = profile.get("email", "")

    if not user_email:
        print(f"[cron] Skipping user {user_id} — no email on profile")
        return

    years      = _get_years(profile)
    exp_level  = _get_experience_level(years)
    is_fresher = years == 0
    print(f"[cron] Processing {user_email}: {exp_level} ({years} yrs)")

    # ── Company preference filter ─────────────────────────────────────────────
    pref     = _normalize_pref(profile.get("company_pref"))
    filtered = all_jobs if "all" in pref else (
        [j for j in all_jobs if j.get("company_type") in pref] or all_jobs
    )

    # ── Role + location relevance filter ─────────────────────────────────────
    user_roles = [
        (r.get("value") or r.get("label") or r if isinstance(r, dict) else r).lower().strip()
        for r in (profile.get("target_roles") or [])
    ]
    locs = list(profile.get("locations") or [])
    if profile.get("location"):
        locs.append(profile["location"])
    user_locations = [str(l).lower().strip() for l in locs if l]

    if user_roles or user_locations:
        relevance_filtered = [
            j for j in filtered
            if (any(role in (j.get("title") or "").lower() for role in user_roles) if user_roles else False)
            or (any(loc  in (j.get("location") or "").lower() for loc  in user_locations) if user_locations else False)
        ]
        if relevance_filtered:
            filtered = relevance_filtered

    # ── Fresher pre-filter ────────────────────────────────────────────────────
    if is_fresher:
        senior_kw  = ["senior", "sr.", "sr ", "lead ", "principal", "staff ",
                       "manager", "director", "head of", "architect",
                       "5+ years", "6+ years", "7+ years", "8+ years", "10+ years",
                       "minimum 5 years", "minimum 3 years"]
        fresher_kw = ["entry level", "entry-level", "fresher", "freshers",
                       "graduate", "graduates", "0-", "0 to", "0-1", "0-2",
                       "1 year", "1+ year", "2 years", "junior", "jr ", "jr.",
                       "associate", "trainee", "intern", "internship",
                       "no experience", "immediate joiner"]

        fresher_filtered = []
        for j in filtered:
            text = ((j.get("title") or "") + " " + (j.get("description") or "")).lower()
            if any(kw in text for kw in senior_kw):
                continue
            if any(kw in text for kw in fresher_kw):
                j["fresher_boost"] = True
            fresher_filtered.append(j)

        if len(fresher_filtered) >= 5:
            filtered = fresher_filtered
            print(f"[cron] Fresher filter: {len(filtered)} jobs remaining")
        else:
            print(f"[cron] Fresher filter too strict — using all {len(filtered)} jobs")

    # ── Score ─────────────────────────────────────────────────────────────────
    top_jobs = await score_jobs(filtered, profile)

    # ── Fresher injection ─────────────────────────────────────────────────────
    if is_fresher and top_jobs:
        entry_count = sum(1 for j in top_jobs if j.get("is_entry_level") or j.get("fresher_boost"))
        if entry_count == 0:
            entry_jobs = sorted(
                [j for j in filtered if j.get("is_entry_level") or j.get("fresher_boost")],
                key=lambda x: x.get("score", 50), reverse=True
            )
            if entry_jobs:
                top_jobs = (entry_jobs[:3] + top_jobs)[:20]
                print(f"[cron] Injected {min(3, len(entry_jobs))} entry-level jobs for {user_email}")

    # ── Send ──────────────────────────────────────────────────────────────────
    success = await send_digest(
        to_email=user_email,
        name=profile.get("full_name", ""),
        jobs=top_jobs,
        years_of_experience=years,
    )

    status = "sent" if success else "failed"
    _execute_with_retry(
        admin.table("digest_logs").insert({
            "user_id":          user_id,
            "user_email":       user_email,
            "jobs_sent":        len(top_jobs),
            "status":           status,
            "error":            None if success else "Email send failed",
            "sent_at":          datetime.now(TIMEZONE).isoformat(),
            "experience_level": exp_level,
            "is_fresher":       is_fresher,
            "roles_searched":   user_roles,
            "duration_seconds": int((datetime.now(TIMEZONE) - profile.get("_pipeline_start", datetime.now(TIMEZONE))).total_seconds()),
        })
    )
    print(f"[cron] Digest {status} -> {user_email} ({len(top_jobs)} jobs, {exp_level})")


# ── Scheduled send (sleep -> send) ────────────────────────────────────────────

async def _scheduled_send(profile: dict, all_jobs: list[dict]):
    """
    Aggregation is already done.
    Sleep until the user's exact digest_time, then score + send.
    Runs concurrently for multiple users via asyncio.gather.
    """
    digest_dt    = profile["_digest_dt"]
    pipeline_key = profile.get("_pipeline_key", "")
    user_email   = profile.get("email", str(profile.get("id", "unknown")))

    try:
        now        = datetime.now(TIMEZONE)
        sleep_secs = (digest_dt - now).total_seconds()

        if sleep_secs > 0:
            print(f"[cron] Waiting {sleep_secs:.0f}s -> sending to {user_email} at {digest_dt.strftime('%H:%M:%S IST')}")
            await asyncio.sleep(sleep_secs)
        else:
            print(f"[cron] Sending immediately to {user_email} (late by {abs(sleep_secs):.0f}s)")

        await _send_for_user(profile, all_jobs)

    except Exception as e:
        print(f"[cron] Failed for {user_email}: {e}")
        print(traceback.format_exc())
        try:
            _execute_with_retry(
                admin.table("digest_logs").insert({
                    "user_id":    str(profile.get("id", "")),
                    "user_email": str(profile.get("email", "")),
                    "jobs_sent":  0,
                    "status":     "failed",
                    "error":      str(e)[:500],
                })
            )
        except Exception as log_err:
            print(f"[cron] Also failed to log error: {log_err}")
    finally:
        _active_pipelines.discard(pipeline_key)


# ── Main pipeline ─────────────────────────────────────────────────────────────

async def daily_pipeline():
    """
    Fires every minute. Checks if any user's digest_time is exactly
    PIPELINE_LEAD minutes away. If so, starts aggregation now and
    schedules sends for their exact time.
    """
    now = datetime.now(TIMEZONE)

    # 1. Load active profiles
    try:
        users_resp   = _execute_with_retry(
            admin.table("profiles")
            .select("*")
            .eq("onboarding_complete", True)
            .eq("digest_enabled",      True)
        )
        all_profiles = users_resp.data or [] if users_resp else []
    except Exception as e:
        print(f"[cron] Failed to load profiles: {e}")
        return

    if not all_profiles:
        return

    # 2. Find profiles whose digest_time is exactly PIPELINE_LEAD min away
    due_profiles = _profiles_due_at_lead(all_profiles, now)

    if not due_profiles:
        return  # silent — fires every minute, no need to log empty ticks

    print(f"\n=== Pipeline starting at {now.strftime('%H:%M:%S IST')} ===")
    for p in due_profiles:
        _active_pipelines.add(p["_pipeline_key"])
        p["_pipeline_start"] = datetime.now(TIMEZONE)   # for duration_seconds in digest_logs
        print(f"  -> {p.get('email')} | digest at {_parse_digest_time(p)} | aggregation starting now ({PIPELINE_LEAD} min lead)")

    # 3. Run aggregator for due profiles
    job_count = await run_aggregator(due_profiles)
    if job_count == 0:
        print("[cron] No jobs fetched — aborting sends")
        for p in due_profiles:
            _active_pipelines.discard(p.get("_pipeline_key", ""))
        return

    await asyncio.sleep(1)

    # 4. Load aggregated jobs from DB once (shared across all due users)
    try:
        jobs_resp = _execute_with_retry(admin.table("jobs").select("*"))
        all_jobs  = jobs_resp.data or [] if jobs_resp else []
    except Exception as e:
        print(f"[cron] Failed to load jobs: {e}")
        for p in due_profiles:
            _active_pipelines.discard(p.get("_pipeline_key", ""))
        return

    print(f"[cron] Loaded {len(all_jobs)} jobs — sleeping until scheduled send times")

    # 5. Concurrently sleep-until-exact-time then send for each user
    await asyncio.gather(
        *[_scheduled_send(p, all_jobs) for p in due_profiles],
        return_exceptions=True
    )

    # 6. Cleanup jobs table after all users are sent
    try:
        delete_all_jobs_immediate()
        print("[cron] Jobs table cleaned up")
    except Exception as e:
        print(f"[cron] Cleanup error: {e}")

    print(f"=== Pipeline complete ===\n")


# ── Scheduler lifecycle ───────────────────────────────────────────────────────

def start_scheduler():
    """
    Ticks every minute so it NEVER misses a scheduled digest_time
    regardless of when the server started.

    Logic:
      - Each tick asks "who needs aggregation to start RIGHT NOW?"
      - Answer: users whose digest_time is exactly PIPELINE_LEAD min away
      - _active_pipelines set prevents duplicate runs for the same slot
    """
    scheduler.add_job(
        daily_pipeline,
        CronTrigger(minute="*", timezone=TIMEZONE),
        id="daily_pipeline",
        replace_existing=True,
        misfire_grace_time=30,
        max_instances=10,
    )
    scheduler.start()
    print(f"Scheduler started — ticking every minute, {PIPELINE_LEAD}-min lead time, timezone={TIMEZONE}")


def shutdown_scheduler():
    scheduler.shutdown()
    print("Scheduler stopped")