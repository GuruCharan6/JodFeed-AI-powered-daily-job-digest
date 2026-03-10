import httpx
from datetime import datetime, timedelta, timezone
from app.config import get_settings


async def fetch_jsearch(role: str, location: str, experience_level: str = None) -> list[dict]:
    """
    Fetch jobs from JSearch API.

    Args:
        role: Job title to search for
        location: Location to search in
        experience_level: 'fresher', 'junior', 'mid', 'senior', or None
    """
    settings = get_settings()

    if not settings.jsearch_api_key:
        print("JSearch error: jsearch_api_key is not set in config/env. Skipping.")
        return []

    query = role
    if experience_level == "fresher":
        query = f"{role} entry level OR {role} junior OR {role} fresher OR {role} graduate OR {role} 0-1 years"
    elif experience_level == "junior":
        query = f"{role} junior OR {role} 1-2 years OR {role} entry level"

    url = "https://jsearch.p.rapidapi.com/search"
    params = {
        "query": f"{query} in {location}",
        "num_pages": "2",
        "employment_types": (
            "FULLTIME,CONTRACTOR,INTERN"
            if experience_level in ("fresher", "junior")
            else "FULLTIME,PARTTIME,CONTRACTOR"
        ),
    }

    if experience_level == "fresher":
        params["job_requirements"] = "no_experience,under_3_years_experience"
    elif experience_level == "junior":
        params["job_requirements"] = "under_3_years_experience"

    headers = {
        "X-RapidAPI-Key":  settings.jsearch_api_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(url, params=params, headers=headers)

            if r.status_code != 200:
                print(f"JSearch error: HTTP {r.status_code} — {r.text[:300]}")
                return []

            data = r.json()

            if "message" in data and "data" not in data:
                print(f"JSearch error: API message — {data['message']}")
                return []

            now        = datetime.now(timezone.utc)
            scraped_at = now.isoformat()
            expires_at = (now + timedelta(days=7)).isoformat()  # matches DB default of 7 days

            jobs = []
            for j in data.get("data", []):
                apply_url = j.get("job_apply_link") or j.get("job_google_link", "")
                if not apply_url:
                    continue

                description = j.get("job_description", "")
                title       = j.get("job_title", "")
                employer    = j.get("employer_name", "")

                jobs.append({
                    # ── DB columns (exact match to Supabase jobs table) ───
                    "title":               title,
                    "company":             employer,
                    "location":            j.get("job_city") or j.get("job_country", ""),
                    "description":         description[:600],
                    "source":              "jsearch",
                    "apply_url":           apply_url,
                    "company_type":        _detect_company_type(employer),
                    "posted_date":         j.get("job_posted_at_datetime_utc"),
                    "scraped_at":          scraped_at,
                    "expires_at":          expires_at,
                    "experience_required": _extract_experience_years(description),
                    # id, dedup_hash, created_at are set by aggregator/Supabase

                    # ── In-memory only — stripped before DB upsert ────────
                    "_is_entry_level":     _is_entry_level_job(description, title),
                })

            return jobs

    except httpx.TimeoutException:
        print(f"JSearch error: Request timed out for '{role}' in '{location}'")
        return []
    except Exception as e:
        print(f"JSearch error: {e}")
        return []


def _is_entry_level_job(description: str, title: str) -> bool:
    """Detect if job is entry-level based on keywords."""
    text = (description + " " + title).lower()

    entry_keywords = [
        "entry level", "entry-level", "fresher", "freshers",
        "graduate", "graduates", "0-1", "0 to 1", "0-2",
        "1 year", "1+ year", "2 years", "2+ years",
        "junior", "jr ", "jr.", "associate", "trainee",
        "no experience", "0 experience", "immediate joiner",
        "intern", "internship", "apprentice",
    ]
    senior_keywords = [
        "senior", "sr ", "sr.", "lead", "principal", "staff engineer",
        "5+ years", "5-7 years", "7+ years", "8+ years", "10+ years",
        "manager", "director", "head of", "architect",
    ]

    entry_score  = sum(1 for kw in entry_keywords  if kw in text)
    senior_score = sum(1 for kw in senior_keywords if kw in text)

    return entry_score > senior_score or (entry_score > 0 and senior_score == 0)


def _extract_experience_years(description: str) -> str:
    """
    Extract minimum years of experience as a text string (e.g. '0', '2', '5').
    Returns '0' if none found. Column type is text in DB.
    """
    import re
    text = description.lower()

    patterns = [
        r'(\d+)\+?\s*-\s*\d+\s*years?',   # 3-5 years
        r'(\d+)\+\s*years?',               # 3+ years
        r'minimum\s*(\d+)\s*years?',       # minimum 3 years
        r'at\s*least\s*(\d+)\s*years?',    # at least 3 years
        r'(\d+)\s*years?\s*of\s*exp',      # 3 years of exp
    ]

    found = []
    for pattern in patterns:
        for m in re.finditer(pattern, text):
            try:
                found.append(int(m.group(1)))
            except (IndexError, ValueError):
                pass

    return str(min(found)) if found else "0"


def _detect_company_type(employer_name: str) -> str:
    """Classify company as 'startup', 'mnc', 'product', or 'other'."""
    name = employer_name.lower()

    mnc_hints = [
        "google", "microsoft", "amazon", "meta", "apple", "ibm", "oracle",
        "accenture", "infosys", "wipro", "tcs", "cognizant", "capgemini",
        "deloitte", "pwc", "kpmg", "jp morgan", "goldman", "morgan stanley",
        "hsbc", "barclays", "citibank", "cisco", "intel", "samsung", "siemens",
    ]
    product_hints = [
        "labs", "technologies", "tech", "software", "systems", "solutions",
        "platform", "cloud", "data", "analytics", "digital",
    ]

    if any(h in name for h in mnc_hints):
        return "mnc"
    if any(h in name for h in product_hints):
        return "product"
    if len(name.split()) <= 2 and not any(
        s in name for s in ["ltd", "limited", "pvt", "inc", "corp", "llc"]
    ):
        return "startup"
    return "other"