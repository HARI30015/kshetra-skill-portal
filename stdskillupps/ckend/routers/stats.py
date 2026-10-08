"""LeetCode stats sync endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from deps import get_current_profile, get_supabase, self_or_lecturer
from services.leetcode import fetch_leetcode_stats
from shaping import stats_out

router = APIRouter(prefix="/stats", tags=["stats"])


def _get_stats(db: Client, profile_id: str):
    resp = db.table("student_stats").select("*").eq("profile_id", profile_id).single().execute()
    return resp.data


@router.post("/sync/{profile_id}")
def sync_stats(
    profile_id: str,
    profile: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    self_or_lecturer(profile_id, profile)

    prof_resp = db.table("profiles").select("leetcode_username").eq("id", profile_id).single().execute()
    target = prof_resp.data
    if target is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    username = (target.get("leetcode_username") or "").strip()
    fetched = fetch_leetcode_stats(username)
    error = fetched.pop("error", None)

    row = {
        "profile_id": profile_id,
        "leetcode_total_solved": fetched["total"],
        "leetcode_easy": fetched["easy"],
        "leetcode_medium": fetched["medium"],
        "leetcode_hard": fetched["hard"],
        "language_stats": fetched["language_stats"],
    }
    upserted = db.table("student_stats").upsert(row, on_conflict="profile_id").execute()
    result = stats_out(upserted.data[0] if upserted.data else row)
    if error:
        result = {**result, "warning": error}
    return result


@router.get("/{profile_id}")
def get_stats(
    profile_id: str,
    profile: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    self_or_lecturer(profile_id, profile)
    stats = _get_stats(db, profile_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="No stats synced yet for this profile")
    return stats_out(stats)
