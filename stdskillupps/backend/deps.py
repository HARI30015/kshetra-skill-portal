"""Shared dependencies: Supabase clients + auth guards."""
import os

from fastapi import Depends, HTTPException, Request
from supabase import Client, create_client

_supabase_service: Client | None = None
_supabase_anon: Client | None = None


def get_supabase() -> Client:
    """Service-role client (bypasses RLS). Used for all DB access."""
    global _supabase_service
    if _supabase_service is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_KEY", "")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_KEY not set")
        _supabase_service = create_client(url, key)
    return _supabase_service


def get_supabase_anon() -> Client:
    """Anon client, used only to validate user JWTs via auth.get_user()."""
    global _supabase_anon
    if _supabase_anon is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_ANON_KEY", "")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL / SUPABASE_ANON_KEY not set")
        _supabase_anon = create_client(url, key)
    return _supabase_anon


def get_current_user(request: Request):
    """Validate Authorization: Bearer <supabase_jwt> and return the auth user.

    Use this on endpoints where no profile row may exist yet (signup).
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    jwt = auth.removeprefix("Bearer ").strip()

    try:
        user_resp = get_supabase_anon().auth.get_user(jwt)
    except Exception as exc:  # invalid / expired token
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc

    user = user_resp.user
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


def get_current_profile(
    request: Request,
    db: Client = Depends(get_supabase),
    user=Depends(get_current_user),
) -> dict:
    """Validate Authorization: Bearer <supabase_jwt> and return the profile row."""
    try:
        profile_resp = db.table("profiles").select("*").eq("id", user.id).single().execute()
    except Exception:
        # .single() raises when no row matches — treat as "no profile yet".
        profile_resp = None
    profile = profile_resp.data if profile_resp else None
    if profile is None:
        # 404 (not 403): the frontend treats this as "new user → create profile".
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def require_lecturer(profile: dict = Depends(get_current_profile)) -> dict:
    if profile.get("role") != "lecturer":
        raise HTTPException(status_code=403, detail="Lecturer access required")
    return profile


def self_or_lecturer(profile_id: str, profile: dict) -> None:
    """Raise 403 unless the caller is the owner of profile_id or a lecturer."""
    if profile["id"] != profile_id and profile.get("role") != "lecturer":
        raise HTTPException(status_code=403, detail="Not authorized for this profile")
