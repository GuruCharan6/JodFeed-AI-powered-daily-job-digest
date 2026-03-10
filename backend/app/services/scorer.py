"""
app/services/scorer.py

Reads years_of_experience to filter and score jobs.
NO JSearch calls — only reads from the jobs table populated by aggregator.

OPTIMIZATIONS:
──────────────
1. combo_key filter  — only fetches jobs relevant to THIS user's roles/locations.
                       Prevents loading 1000 irrelevant jobs per user.

2. Pre-filter        — drops unsuitable jobs before sending to Groq.
                       Fewer tokens = faster + cheaper scoring.

3. Batch scoring     — sends BATCH_SIZE jobs per Groq call.
                       Prevents prompt overflow for users with many matches.

4. Single DB query   — fetches all relevant jobs in one Supabase call.

Returns top TOP_N jobs sorted by score.
"""

import json
import asyncio
from groq import AsyncGroq
from app.config import get_settings
from app.database import admin

TOP_N      = 20
BATCH_SIZE = 25   # jobs per Groq call

_groq_client = None


def _get_groq() -> AsyncGroq:
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=get_settings().groq_api_key)
    return _groq_client


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_years(profile: dict) -> int:
    yoe = profile.get("years_of_experience")
    return int(yoe) if yoe is not None else 0


def _level_str(years: int) -> str:
    if years == 0:  return "fresher"
    if years <= 2:  return "junior"
    if years <= 5:  return "mid"
    if years <= 10: return "senior"
    return "expert"


def _level_label(years: int) -> str:
    if years == 0:  return "Fresher (0 years)"
    if years <= 2:  return f"Junior ({years} yrs)"
    if years <= 5:  return f"Mid-level ({years} yrs)"
    if years <= 10: return f"Senior ({years} yrs)"
    return f"Expert ({years}+ yrs)"


def _combo_key(role: str, location: str, level: str) -> str:
    return f"{role.lower().strip()}|{location.lower().strip()}|{level}"


def _get_user_combo_keys(profile: dict) -> list[str]:
    """
    Build the list of combo_keys for this user.
    Only jobs tagged with these keys are pulled from DB.
    """
    years = _get_years(profile)
    level = _level_str(years)

    locations: list[str] = profile.get("locations") or []
    if not locations:
        raw = profile.get("location") or "Bangalore"
        locations = [str(raw).strip()]

    raw_roles = profile.get("target_roles") or []
    if isinstance(raw_roles, str):
        raw_roles = [raw_roles]

    keys: set[str] = set()
    for r in raw_roles:
        role = (r.get("value") if isinstance(r, dict) else str(r)).strip()
        if not role:
            continue
        for loc in locations:
            keys.add(_combo_key(role, loc, level))
        if profile.get("remote"):
            keys.add(_combo_key(role, "remote", level))

    return list(keys)


# ── Fetch from DB (no JSearch) ────────────────────────────────────────────────

def _fetch_jobs_for_user(profile: dict) -> list[dict]:
    """
    Pull relevant jobs from Supabase using combo_key filter.
    Single DB query — no external API calls.
    """
    from datetime import datetime, timezone
    keys = _get_user_combo_keys(profile)
    if not keys:
        return []

    now = datetime.now(timezone.utc).isoformat()

    try:
        # Supabase .in_() filter — one query for all combos
        resp = (
            admin.table("jobs")
            .select("id,title,company,location,description,apply_url,source,is_entry_level")
            .in_("combo_key", keys)
            .gt("expires_at", now)
            .limit(150)   # generous pool for scorer to work with
            .execute()
        )
        jobs = resp.data or []
        print(f"  [scorer] {len(jobs)} jobs from DB for {len(keys)} combo(s)")
        return jobs
    except Exception as e:
        print(f"  [scorer] DB fetch error: {e}")
        return []


# ── Suitability pre-filter ────────────────────────────────────────────────────

_SENIOR_BLOCK = frozenset([
    "senior", "sr.", "lead", "principal", "staff engineer",
    "architect", "head of", "vp ", "director", "manager",
    "5+ years", "7+ years", "8+ years", "10+ years",
])
_MID_BLOCK = frozenset([
    "principal", "staff engineer", "architect",
    "head of", "vp ", "director",
])


def _is_suitable(title: str, desc: str, years: int) -> bool:
    text = f"{title} {desc}".lower()
    if years <= 2:
        return not any(kw in text for kw in _SENIOR_BLOCK)
    if years <= 5:
        return not any(kw in text for kw in _MID_BLOCK)
    return True


# ── Groq scoring ─────────────────────────────────────────────────────────────

def _build_prompt(jobs_json: str, profile: dict, years: int) -> str:
    skills   = profile.get("skills", [])
    roles    = profile.get("target_roles", [])
    location = profile.get("location", "Bangalore")
    label    = _level_label(years)

    if years == 0:
        rules = """
SCORING RULES for fresher:
  entry-level / junior / graduate / trainee / intern → 70–95
  skill match bonus                                  → +20
  location match                                     → +15
  senior / lead / principal / architect              → max 20"""
    else:
        rules = """
SCORING RULES:
  role title match  → 40 pts
  skills match      → 30 pts
  location match    → 20 pts
  company type      → 10 pts"""

    return f"""Score each job 0–100 for this candidate.
{rules}

CANDIDATE:
  Skills:     {skills}
  Roles:      {roles}
  Location:   {location}
  Experience: {label}

JOBS:
{jobs_json}

Reply ONLY with a JSON array, no extra text:
[{{"id": "uuid", "score": 85}}, ...]"""


def _fix_truncated_json(raw: str) -> str | None:
    raw = raw.strip()
    if raw.startswith("[") and not raw.endswith("]"):
        last = raw.rfind("}")
        if last > 0:
            return raw[:last + 1] + "\n]"
    return None


async def _score_batch(batch: list[dict], profile: dict, years: int) -> dict[str, int]:
    """Score a batch of jobs via Groq. Returns {job_id: score}."""
    jobs_data = [
        {
            "id":       str(j.get("id", "")),
            "title":    str(j.get("title", "")),
            "company":  str(j.get("company", "")),
            "location": str(j.get("location", "")),
            "desc":     str(j.get("description", ""))[:200],
        }
        for j in batch
    ]

    prompt = _build_prompt(json.dumps(jobs_data, ensure_ascii=False), profile, years)

    for attempt in range(2):
        try:
            resp = await _get_groq().chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0.1,
            )
            raw = resp.choices[0].message.content.strip()

            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            try:
                scores = json.loads(raw)
            except json.JSONDecodeError:
                fixed  = _fix_truncated_json(raw)
                scores = json.loads(fixed) if fixed else []

            return {s["id"]: s["score"] for s in scores}

        except Exception as e:
            print(f"  [scorer] Groq attempt {attempt+1} failed: {e}")
            if attempt == 0:
                await asyncio.sleep(2)

    # Groq failed — return default scores so digest still sends
    return {str(j.get("id", "")): 50 for j in batch}


# ── Public API ────────────────────────────────────────────────────────────────

async def score_jobs(jobs: list[dict], profile: dict) -> list[dict]:
    """
    Score jobs for a single user.
    If jobs list is empty, fetches from DB automatically.
    Returns top TOP_N sorted by score.
    """
    if not jobs:
        jobs = _fetch_jobs_for_user(profile)

    if not jobs:
        return []

    years = _get_years(profile)
    print(f"  [scorer] {_level_label(years)}, pool={len(jobs)}")

    # Pre-filter unsuitable jobs
    suitable = [j for j in jobs if _is_suitable(j.get("title", ""), j.get("description", ""), years)]
    if not suitable:
        print("  [scorer] filter too strict — using full pool")
        suitable = jobs

    print(f"  [scorer] {len(suitable)} after pre-filter")

    # Split into batches and score each
    score_map: dict[str, int] = {}
    batches = [suitable[i:i+BATCH_SIZE] for i in range(0, len(suitable), BATCH_SIZE)]
    print(f"  [scorer] {len(batches)} Groq batch(es) of up to {BATCH_SIZE}")

    for i, batch in enumerate(batches):
        batch_scores = await _score_batch(batch, profile, years)
        score_map.update(batch_scores)
        if i < len(batches) - 1:
            await asyncio.sleep(0.4)   # small delay between Groq calls

    # Apply scores
    for j in suitable:
        j["score"] = score_map.get(str(j.get("id", "")), 50)

    result = sorted(suitable, key=lambda x: x["score"], reverse=True)
    print(f"  [scorer] top score: {result[0]['score'] if result else 'n/a'}")
    return result[:TOP_N]