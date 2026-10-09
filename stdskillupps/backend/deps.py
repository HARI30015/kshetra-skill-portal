"""Shared dependencies: Supabase clients + auth guards."""
import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from supabase import create_client, Client

from shaping import profile_out

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

_bearer = HTTPBearer(auto_error=False)

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_service_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_current_user_id(creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer)) -> str:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Bearer token")
    token = creds.credentials
    try:
        payload = jwt.get_unverified_claims(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims")
    return user_id

def get_current_profile(user_id: str = Depends(get_current_user_id)):
    db = get_service_supabase()
    try:
        profile_resp = db.table("profiles").select("*").eq("id", user_id).single().execute()
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    profile = profile_resp.data
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile_out(profile)

def require_lecturer(profile: dict = Depends(get_current_profile)):
    if profile.get("role") != "lecturer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Lecturer access required")
    return profile
