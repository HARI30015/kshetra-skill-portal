"""Profile endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
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


@router.get("/email-exists")
def email_exists(email: str, db: Client = Depends(get_supabase)):
    """Pre-auth check for the sign-up / sign-in forms: does this email
    already have an account (i.e. a profile row)? The UI uses it to send
    existing users to sign-in instead of a duplicate sign-up, and to
    tell unknown emails apart from wrong passwords at sign-in."""
    resp = (
        db.table("profiles")
        .select("id")
        .ilike("email", email.strip())
        .limit(1)
        .execute()
    )
    return {"exists": bool(resp.data)}


@router.get("/me")
def get_me(profile: dict = Depends(get_current_profile)):
    return profile_out(profile)


@router.delete("/me/incomplete")
def delete_my_incomplete_profile(
    user=Depends(get_current_user),
    db: Client = Depends(get_supabase),
):
    """Delete the caller's profile row ONLY when it is half-done: never
    onboarded and no user-entered fields filled in. This runs when a
    sign-in breaks midway (or the user signs out mid-setup) so the next
    sign-in starts with fresh info. Completed profiles are never touched
    — the guard below is checked server-side on every call."""
    resp = db.table("profiles").select("*").eq("id", user.id).execute()
    rows = resp.data or []
    if not rows:
        return {"deleted": False, "reason": "no profile"}
    row = rows[0]
    user_fields = ("year", "target_field", "leetcode_username", "campustrack_username")
    if row.get("onboarded") or any(row.get(k) for k in user_fields):
        return {"deleted": False, "reason": "profile has user data"}
    db.table("profiles").delete().eq("id", user.id).execute()
    return {"deleted": True}


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
    
    # Update last_login_at. NOTE: the value must be a real ISO timestamp —
    # the literal string "now()" is not valid timestamptz input, so
    # PostgREST rejected the update and last_login_at was never set.
    try:
        db.table("profiles").update(
            {"last_login_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", user.id).execute()
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


@router.post("/admin/sync-all")
def admin_sync_all(request: Request, db: Client = Depends(get_supabase)):
    """ONE-TIME admin bulk LeetCode sync (added 2026-10-22 at the
    owner's request): runs the same sync as POST /stats/sync-all for
    every profile with a LeetCode username. Guarded by the ADMIN_TOKEN
    env var: while unset, answers 404 to everyone. Remove after use."""
    import os
    import secrets

    from services.leetcode import fetch_leetcode_stats

    expected = os.getenv("ADMIN_TOKEN", "")
    provided = request.headers.get("x-admin-token", "")
    if not expected or not secrets.compare_digest(provided, expected):
        raise HTTPException(status_code=404, detail="Not found")
    resp = db.table("profiles").select("id, email, leetcode_username").execute()
    results = []
    for p in resp.data or []:
        username = (p.get("leetcode_username") or "").strip()
        if not username:
            continue
        fetched = fetch_leetcode_stats(username)
        error = fetched.pop("error", None)
        row = {
            "profile_id": p["id"],
            "leetcode_total_solved": fetched["total"],
            "leetcode_easy": fetched["easy"],
            "leetcode_medium": fetched["medium"],
            "leetcode_hard": fetched["hard"],
            "language_stats": fetched["language_stats"],
        }
        db.table("student_stats").upsert(row, on_conflict="profile_id").execute()
        results.append(
            {
                "email": p.get("email"),
                "leetcode_username": username,
                "total_solved": fetched["total"],
                "warning": error,
            }
        )
    return {"synced": len(results), "results": results}
