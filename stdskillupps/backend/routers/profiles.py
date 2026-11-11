"""Profile endpoints."""
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from deps import get_current_profile, get_current_user, get_supabase, require_lecturer, self_or_lecturer
from shaping import normalize_profile_update, profile_out
from services.leetcode import leetcode_user_exists

router = APIRouter(prefix="/profiles", tags=["profiles"])


class ProfileCreate(BaseModel):
    full_name: str | None = None
    email: str | None = None


def _valid_avatar_path(value: object) -> bool:
    """Accept a relative storage object path, never a public URL."""
    if not isinstance(value, str) or not value or len(value) > 1024:
        return False
    parts = value.split("/")
    if len(parts) < 2:
        return False
    return all(
        part not in (".", "..")
        and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,254}", part) is not None
        for part in parts
    )


@router.post("")
def create_profile(
    body: ProfileCreate,
    user=Depends(get_current_user),
    db: Client = Depends(get_supabase),
):
    """Create the profile row for the signed-up user (their auth id is the PK).

    First-time users have no profile row yet, so this validates only the JWT.
    """
    existing = db.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    if existing.data:
        return profile_out(existing.data[0])
    # The JWT's email is authoritative: the frontend does not send
    # one, and writing null here silently wiped the email of profiles
    # that already had one (found by smoke test, 2026-10-23), which
    # broke the email-exists routing for those accounts.
    row = {"id": user.id, "full_name": body.full_name, "role": "student", "email": body.email or user.email}
    try:
        resp = db.table("profiles").insert(row).execute()
        created = resp.data[0] if resp.data else row
    except Exception:
        # A concurrent signup request may have inserted the row after the
        # initial read. Return that row unchanged, including lecturer role.
        existing = db.table("profiles").select("*").eq("id", user.id).limit(1).execute()
        if not existing.data:
            raise
        created = existing.data[0]
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


@router.get("/me/login-history")
def my_login_history(
    user=Depends(get_current_user),
    db: Client = Depends(get_supabase),
):
    """Read-only: the signed-in user's own sign-in timestamps, for the streak.
    Returns only this user's rows. The frontend hides the streak when empty."""
    resp = (
        db.table("login_history")
        .select("*")
        .eq("user_id", user.id)
        .limit(1000)
        .execute()
    )
    stamps = []
    for row in resp.data or []:
        # login_history's timestamp column name is not fixed; first match wins.
        for key in ("logged_in_at", "login_at", "created_at", "timestamp"):
            if row.get(key):
                stamps.append(str(row[key]))
                break
    stamps.sort(reverse=True)
    return {"logins": stamps[:120]}


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
    if "avatar_path" in updates:
        avatar_path = updates["avatar_path"]
        if not _valid_avatar_path(avatar_path):
            raise HTTPException(status_code=400, detail="avatar_path must be a relative storage object path")
        if profile.get("role") != "lecturer" and profile_id == profile.get("id"):
            if avatar_path.split("/", 1)[0] != str(profile_id):
                raise HTTPException(status_code=400, detail="avatar_path must be inside your profile folder")
    # Real-or-fake check (owner's rule, 2026-10-22): a LeetCode
    # username is accepted only when LeetCode confirms the account
    # really exists. CampusTrack has no public API to check against,
    # so its username gets a format check here and stays
    # lecturer-verified, as before.
    lc_name = updates.get("leetcode_username")
    if isinstance(lc_name, str) and lc_name.strip():
        if leetcode_user_exists(lc_name.strip()) is False:
            raise HTTPException(
                status_code=400,
                detail=f"LeetCode user '{lc_name.strip()}' not found. Enter a real LeetCode username.",
            )
    ct_name = updates.get("campustrack_username")
    if isinstance(ct_name, str) and ct_name.strip():
        cleaned = ct_name.strip()
        if len(cleaned) > 60 or any(ch.isspace() for ch in cleaned):
            raise HTTPException(
                status_code=400,
                detail="Enter a valid CampusTrack username (no spaces).",
            )
    if "year" in updates and not (1 <= updates["year"] <= 4):
        raise HTTPException(status_code=400, detail="year must be between 1 and 4")
    resp = db.table("profiles").update(updates).eq("id", profile_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_out(resp.data[0])


@router.get("/me/sync-key")
def my_campustrack_sync_key(profile=Depends(get_current_profile)):
    """The signed-in student's personal CampusTrack sync key plus the
    ready-to-drag bookmarklet carrying it. The key is derived (HMAC
    of the profile id with a server secret), never stored."""
    from routers.campustrack_sync import API_BASE, sync_key_for

    key = sync_key_for(profile["id"])
    if not key:
        raise HTTPException(status_code=503, detail="CampusTrack sync is not configured")
    bookmarklet = (
        "javascript:(function(){var s=document.createElement('script');s.src='"
        + API_BASE
        + "/campustrack-sync.js?pid="
        + str(profile["id"])
        + "&k="
        + key
        + "';document.body.appendChild(s);})();"
    )
    return {"profile_id": profile["id"], "key": key, "bookmarklet": bookmarklet}
