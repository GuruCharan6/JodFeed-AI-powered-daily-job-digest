"""
app/routers/profile.py

FIX: Use body.dict(exclude_unset=True) so only fields the client
actually sent are written to the DB. This means:
  - remote=False  → saved correctly (was being skipped before)
  - years_of_experience=0 → saved correctly (was being skipped before)
  - Fields not in the request → left untouched in the DB

experience_years is the single source of truth.
Backend derives and persists is_fresher + experience_level automatically.
"""

from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.database import admin
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


# ── Experience helpers ────────────────────────────────────────────────────────

def _derive(years: float) -> dict:
    """
    Derive is_fresher and experience_level from years_of_experience.
    Single source of truth — mirrors frontend deriveLevel().
    """
    y = int(years)
    if y == 0:      level = "fresher"
    elif y <= 2:    level = "junior"
    elif y <= 5:    level = "mid"
    elif y <= 10:   level = "senior"
    else:           level = "expert"

    return {
        "years_of_experience": float(years),
        "is_fresher":          y == 0,
        "experience_level":    level,
    }


def _resolve_years(profile: dict) -> float:
    """Read years_of_experience from a DB row, falling back to is_fresher."""
    yoe = profile.get("years_of_experience")
    if yoe is not None:
        return float(yoe)
    # CHANGED: differentiate fresher fallback from default
    if profile.get("is_fresher"):
        return 0.0
    return 1.0  # assume junior if no data available


# ── Schema ────────────────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    # Core
    full_name:           Optional[str]       = None
    skills:              Optional[List[str]] = None
    target_roles:        Optional[List[str]] = None
    locations:           Optional[List[str]] = None
    location:            Optional[str]       = None
    remote:              Optional[bool]      = None
    company_pref:        Optional[List[str]] = None

    # Digest
    onboarding_complete: Optional[bool]      = None
    digest_enabled:      Optional[bool]      = None
    digest_time:         Optional[str]       = None
    digest_type:         Optional[str]       = None

    # Experience — frontend sends ONLY years_of_experience
    years_of_experience: Optional[float]     = None

    # Legacy (still accepted, overridden by _derive())
    is_fresher:          Optional[bool]      = None
    experience_level:    Optional[str]       = None


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
def get_profile(user=Depends(get_current_user)):
    r = admin.table("profiles").select("*").eq("id", user.id).execute()

    if not r.data:
        derived = _derive(0)
        admin.table("profiles").insert({
            "id":    user.id,
            "email": user.email,
            **derived,
        }).execute()
        r = admin.table("profiles").select("*").eq("id", user.id).execute()

    profile = r.data[0]

    # Backfill locations array from legacy location string
    if not profile.get("locations") and profile.get("location"):
        profile["locations"] = [profile["location"]]

    # Re-derive and sync experience fields on every read
    years   = _resolve_years(profile)
    derived = _derive(years)
    profile.update(derived)

    # CHANGED: only write back if there's actually a drift — avoids unnecessary
    # DB write on every single GET request.
    needs_sync = (
        profile.get("years_of_experience") != derived["years_of_experience"]
        or profile.get("is_fresher") != derived["is_fresher"]
        or profile.get("experience_level") != derived["experience_level"]
    )
    if needs_sync:
        admin.table("profiles").update(derived).eq("id", user.id).execute()

    return profile


@router.patch("/")
def update_profile(body: ProfileUpdate, user=Depends(get_current_user)):
    # ── KEY FIX ──────────────────────────────────────────────────────────────
    # exclude_unset=True means only fields the client explicitly sent are
    # included. Without this, remote=False and years_of_experience=0 would
    # be filtered out by the old `if v is not None` check, and fields not
    # sent would default to None and overwrite existing DB values.
    data = body.dict(exclude_unset=True)

    if not data:
        return {"ok": True}

    # Sync location string ↔ locations array
    if "locations" in data and data["locations"]:
        data["location"] = data["locations"][0]
    elif "location" in data and "locations" not in data:
        data["locations"] = [data["location"]]

    # Whenever years_of_experience is sent, derive all experience fields
    if "years_of_experience" in data:
        data.update(_derive(data["years_of_experience"]))

    admin.table("profiles").update(data).eq("id", user.id).execute()
    return {"ok": True}
