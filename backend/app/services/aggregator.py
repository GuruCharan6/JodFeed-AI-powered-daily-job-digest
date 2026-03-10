"""
app/services/aggregator.py

ARCHITECTURE — how API calls are minimized:
────────────────────────────────────────────
JSearch is called ONCE per unique (role, location, level) combo across ALL users.

  Example:
    100 users all want "AI Engineer in Bangalore" (fresher)
    → 1 fetch, results shared by all 100 users
    → NOT 100 fetches

  The aggregator runs on a CRON (once/day).
  Scorer and mailer only read from the jobs table — zero JSearch calls.

Cache logic per combo:
  • < 6h since last fetch  → SKIP (fresh)
  • 6–24h and ≥ 10 jobs    → SKIP
  • > 24h or < 10 jobs     → FETCH

Freshers get 2 queries per role, everyone else gets 1.
Total API calls = unique_combos × queries_per_combo × (1 if stale else 0)
"""

import asyncio
import hashlib
from datetime import datetime, timezone, timedelta
from app.services.jsearch import fetch_jsearch
from app.database import admin

CACHE_TTL_H     = 6     # hours — fresh, skip fetch
STALE_TTL_H     = 24    # hours — always re-fetch
MIN_CACHED_JOBS = 10    # below this always re-fetch regardless of age
MAX_JOBS_STORED = 500   # hard cap on total jobs upserted per run

_DB_COLUMNS = {
    "title", "company", "location", "description",
    "source", "apply_url", "dedup_hash", "company_type",
    "posted_date", "scraped_at", "expires_at",
    "experience_required", "combo_key",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _hash(title: str, company: str, location: str) -> str:
    key = f"{title}|{company}|{location}".lower().strip()
    return hashlib.md5(key.encode()).hexdigest()


def _combo_key(role: str, location: str, level: str) -> str:
    """Stable string key used for cache lookups and job tagging."""
    return f"{role.lower().strip()}|{location.lower().strip()}|{level}"


def _get_years(profile: dict) -> int:
    yoe = profile.get("years_of_experience")
    return int(yoe) if yoe is not None else 0


def _level_str(years: int) -> str:
    if years == 0:  return "fresher"
    if years <= 2:  return "junior"
    if years <= 5:  return "mid"
    if years <= 10: return "senior"
    return "expert"


def _queries_for_combo(role: str, level: str) -> list[str]:
    """
    Return the minimal list of search queries for a combo.
    Fewer queries = fewer API calls.
    Freshers need 2 because many entry-level jobs don't say "fresher".
    Everyone else needs 1.
    """
    if level == "fresher":
        return [f"entry level {role}", f"junior {role} fresher"]
    if level == "junior":
        return [f"junior {role}"]
    return [role]   # mid / senior / expert → single query


def _extract_combos(profiles: list[dict]) -> list[tuple[str, str, str]]:
    """
    Collapse ALL profiles into a deduplicated set of (role, location, level).
    N users with same role/location/level = 1 combo = 1 API call.
    """
    combos: set[tuple[str, str, str]] = set()

    for p in profiles:
        level = _level_str(_get_years(p))

        locations: list[str] = p.get("locations") or []
        if not locations:
            raw = p.get("location") or "Bangalore"
            locations = [str(raw).strip()]

        raw_roles = p.get("target_roles") or []
        if isinstance(raw_roles, str):
            raw_roles = [raw_roles]

        for r in raw_roles:
            role = (r.get("value") if isinstance(r, dict) else str(r)).strip()
            if not role:
                continue
            for loc in locations:
                combos.add((role, loc.strip(), level))
            if p.get("remote"):
                combos.add((role, "Remote", level))

    return list(combos)


def _strip_to_db(job: dict) -> dict:
    return {k: v for k, v in job.items() if k in _DB_COLUMNS}


# ── Cache check ───────────────────────────────────────────────────────────────

def _needs_fetch(combo: str) -> bool:
    """
    Returns True only if we actually need to call JSearch.
    Queries Supabase only — no external API involved.
    """
    try:
        now = datetime.now(timezone.utc)

        # Count non-expired jobs + get most recent scraped_at in one query
        count_resp = (
            admin.table("jobs")
            .select("scraped_at", count="exact")
            .eq("combo_key", combo)
            .gt("expires_at", now.isoformat())
            .order("scraped_at", desc=True)
            .limit(1)
            .execute()
        )

        count = count_resp.count or 0

        if count == 0:
            print(f"    [COLD]   {combo}")
            return True

        if count < MIN_CACHED_JOBS:
            print(f"    [SPARSE] {combo} — {count} jobs")
            return True

        if not count_resp.data:
            return True

        latest_str = count_resp.data[0]["scraped_at"]
        latest = datetime.fromisoformat(latest_str.replace("Z", "+00:00"))
        age_h = (now - latest).total_seconds() / 3600

        if age_h < CACHE_TTL_H:
            print(f"    [FRESH]  {combo} — {count} jobs, {age_h:.1f}h → SKIP")
            return False

        if age_h > STALE_TTL_H:
            print(f"    [STALE]  {combo} — {age_h:.1f}h → FETCH")
            return True

        # 6–24h with enough jobs → skip
        print(f"    [WARM]   {combo} — {count} jobs, {age_h:.1f}h → SKIP")
        return False

    except Exception as e:
        print(f"    [cache error] {combo}: {e} — fetching anyway")
        return True


# ── Main ──────────────────────────────────────────────────────────────────────

async def run_aggregator(profiles: list[dict] | None = None) -> int:
    """
    Called by cron once per day.
    Fetches jobs only for stale/cold combos. All users share the results.
    Returns number of new jobs upserted.
    """
    if not profiles:
        resp = (
            admin.table("profiles")
            .select("target_roles,location,locations,remote,years_of_experience,is_fresher")
            .eq("onboarding_complete", True)
            .eq("digest_enabled", True)
            .execute()
        )
        profiles = resp.data or []

    if not profiles:
        print("Aggregator: no active profiles")
        return 0

    combos = _extract_combos(profiles)
    print(f"\nAggregator: {len(profiles)} profiles → {len(combos)} unique combos\n")

    new_jobs: list[dict] = []
    fetched  = 0
    skipped  = 0

    for role, location, level in combos:
        combo = _combo_key(role, location, level)

        if not _needs_fetch(combo):
            skipped += 1
            continue

        fetched += 1
        queries = _queries_for_combo(role, level)
        print(f"  FETCH [{level}] '{role}' in '{location}' — {len(queries)} quer{'y' if len(queries)==1 else 'ies'}")

        for q in queries:
            try:
                jobs = await fetch_jsearch(q, location, experience_level=level)
                for j in jobs:
                    j["combo_key"] = combo   # tag for future cache lookups
                new_jobs.extend(jobs)
                print(f"    + {len(jobs)} jobs from '{q}'")
            except Exception as e:
                print(f"    ! JSearch error for '{q}': {e}")

            await asyncio.sleep(1.2)         # respect rate limit

    print(f"\nAggregator summary:")
    print(f"  combos total   : {len(combos)}")
    print(f"  fetched        : {fetched}")
    print(f"  skipped(cache) : {skipped}")
    print(f"  raw jobs       : {len(new_jobs)}")

    if not new_jobs:
        print("  nothing new to save\n")
        return 0

    # ── Deduplicate ───────────────────────────────────────────────────────────
    seen:  set[str]   = set()
    clean: list[dict] = []

    for j in new_jobs:
        if not j.get("title") or not j.get("apply_url"):
            continue
        h = _hash(j["title"], j.get("company", ""), j.get("location", ""))
        if h in seen:
            continue
        seen.add(h)
        j["dedup_hash"] = h
        clean.append(j)

    clean = clean[:MAX_JOBS_STORED]
    print(f"  after dedup    : {len(clean)} unique jobs")

    # ── Upsert ────────────────────────────────────────────────────────────────
    db_rows = [_strip_to_db(j) for j in clean]

    try:
        admin.table("jobs").upsert(
            db_rows,
            on_conflict="dedup_hash",
            ignore_duplicates=True,
        ).execute()
        print(f"  saved to DB    : {len(db_rows)}\n")
    except Exception as e:
        print(f"  DB error: {e}\n")
        return 0

    return len(clean)