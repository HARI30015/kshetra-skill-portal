"""Profile endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from deps import get_current_profile, get_current_user, get_supabase, require_lecturer, self_or_lecturer
from shaping import normalize_profile_update, profile_out

router = APIRouter(prefix="/profiles", tags=["profiles"])


class ProfileCreate(BaseModel):
    full_name: str | None = None
    role: str = "student"
    email: str | None = None


@router.post("")
def create_profile(
    body: ProfileCreate,
    user=Depends(get_current_user),
    db: Client = Depends(get_supabase),
):
    """Create the profile row for the signed-up user (their auth id is the PK).

    First-time users have no profile row yet, so this validates only the JWT.
    """
    if body.role not in ("student", "lecturer"):
        raise HTTPException(status_code=400, detail="role must be 'student' or 'lecturer'")
    row = {"id": user.id, "full_name": body.full_name, "role": body.role, "email": body.email}
    resp = db.table("profiles").upsert(row, on_conflict="id").execute()
    created = resp.data[0] if resp.data else row
    return profile_out(created)


@router.get("/me")
def get_me(profile: dict = Depends(get_current_profile)):
    return profile_out(profile)


@router.get("")
def list_profiles(
    _lecturer: dict = Depends(require_lecturer),
    db: Client = Depends(get_supabase),
):
    resp = db.table("profiles").select("*").order("created_at").execute()
    return [profile_out(row) for row in resp.data]


@router.put("/{profile_id}")
def update_profile(
    profile_id: str,
    body: dict,
    profile: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    """Update profile fields. Accepts both canonical column names
    (year, target_field, campustrack_username) and frontend aliases
    (year_of_study, target_job_field, campus_track_username, onboarded)."""
    self_or_lecturer(profile_id, profile)
    updates = normalize_profile_update(body)
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    if "year" in updates and not (1 <= updates["year"] <= 4):
        raise HTTPException(status_code=400, detail="year must be between 1 and 4")
    resp = db.table("profiles").update(updates).eq("id", profile_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_out(resp.data[0])

@router.post("/log-login")
def log_login(request: Request, user=Depends(get_current_user), db: Client = Depends(get_supabase)):
    """Record a login event. Called once by the frontend after successful sign-in."""
    try:
        profile_resp = db.table("profiles").select("id,email,role").eq("id", user.id).single().execute()
        profile = profile_resp.data if profile_resp else None
    except Exception:
        profile = None
    
    # Update last_login_at
    try:
        db.table("profiles").update({"last_login_at": "now()"}).eq("id", user.id).execute()
    except Exception:
        pass
    
    # Insert into login_history
    try:
        db.table("login_history").insert({
            "user_id": user.id,
            "email": (profile or {}).get("email") or user.email,
            "role": (profile or {}).get("role") or "student",
            "ip_address": request.client.host if request.client else None,
        }).execute()
    except Exception:
        pass
    
    return {"ok": True}
