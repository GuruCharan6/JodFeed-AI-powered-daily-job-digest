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


# ── CHANGED: Batch cache check — single query for ALL combos instead of
#   one per combo, eliminating N+1 Supabase round-trips ───────────────────────

def _needs_fetch_batch(combos: list[str]) -> list[str]:
    """
    Given all combo keys, return only those that need a fresh fetch.
    Single DB query instead of one per combo (eliminates N+1).
    """
    if not combos:
        return []

    try:
        now = datetime.now(timezone.utc)

        # Fetch all cached job metadata in one query
        resp = (
            admin.table("jobs")
            .select("combo_key,scraped_at", count="exact")
            .in_("combo_key", combos)
            .gt("expires_at", now.isoformat())
            .execute()
        )

        # Build per-combo stats from single query
        combo_counts: dict[str, int] = {}
        combo_latest: dict[str, datetime] = {}

        for row in (resp.data or []):
            key = row["combo_key"]
            combo_counts[key] = combo_counts.get(key, 0) + 1
            ts_str = row["scraped_at"]
            try:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if key not in combo_latest or ts > combo_latest[key]:
                    combo_latest[key] = ts
            except (ValueError, TypeError):
                pass

        # Decide per combo
    except Exception as e:
        print(f"    [cache error] batch: {e} — fetching all")
        list(combos)  # return all
        return list(combos)

    fetch_list = []
    for combo in combos:
        count = combo_counts.get(combo, 0)

        if count == 0:
            print(f"    [COLD]   {combo}")
            fetch_list.append(combo)
            continue

        if count < MIN_CACHED_JOBS:
            print(f"    [SPARSE] {combo} — {count} jobs")
            fetch_list.append(combo)
            continue

        latest = combo_latest.get(combo)
        if latest is None:
            fetch_list.append(combo)
            continue

        age_h = (now - latest).total_seconds() / 3600

        if age_h < CACHE_TTL_H:
            print(f"    [FRESH]  {combo} — {count} jobs, {age_h:.1f}h → SKIP")
            # continue (skip fetch)
        elif age_h > STALE_TTL_H:
            print(f"    [STALE]  {combo} — {age_h:.1f}h → FETCH")
            fetch_list.append(combo)
        else:
            # 6–24h with enough jobs → skip
            print(f"    [WARM]   {combo} — {count} jobs, {age_h:.1f}h → SKIP")
            # continue (skip fetch)

    return fetch_list


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
    combo_keys = [_combo_key(r, l, lv) for r, l, lv in combos]

    print(f"\nAggregator: {len(profiles)} profiles → {len(combos)} unique combos\n")

    # CHANGED: batch cache check replaces per-combo N+1 queries
    stale_combos_keys = _needs_fetch_batch(combo_keys)  # list[str]
    stale_set = set(stale_combos_keys)

    # Build a lookup from combo_key → (role, location, level) for iteration
    combo_lookup = {}
    for role, location, level in combos:
        key = _combo_key(role, location, level)
        combo_lookup[key] = (role, location, level)

    new_jobs: list[dict] = []
    fetched  = 0
    skipped  = 0

    for key, (role, location, level) in combo_lookup.items():
        if key not in stale_set:
            skipped += 1
            continue

        fetched += 1
        queries = _queries_for_combo(role, level)
        print(f"  FETCH [{level}] '{role}' in '{location}' — {len(queries)} quer{'y' if len(queries)==1 else 'ies'}")

        for q in queries:
            try:
                jobs = await fetch_jsearch(q, location, experience_level=level)
                for j in jobs:
                    j["combo_key"] = key   # tag for future cache lookups
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
        # CHANGED: log how many rows were attempted
        print(f"  DB upsert error ({len(db_rows)} rows attempted): {e}\n")
        return 0

    return len(clean)
