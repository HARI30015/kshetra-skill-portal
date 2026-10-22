"""LeetCode stats sync endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from deps import get_current_profile, get_supabase, require_lecturer, self_or_lecturer
from services.leetcode import fetch_leetcode_stats
from shaping import stats_out

router = APIRouter(prefix="/stats", tags=["stats"])


def _get_stats(db: Client, profile_id: str):
    # .single() raises (PGRST116) when no row matches — a profile with no
    # synced stats yet must return None (→ 404 in get_stats), not a 500.
    try:
        resp = db.table("student_stats").select("*").eq("profile_id", profile_id).single().execute()
    except Exception:
        return None
    return resp.data


@router.post("/sync/{profile_id}")
def sync_stats(
    profile_id: str,
    profile: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    self_or_lecturer(profile_id, profile)

    try:
        prof_resp = db.table("profiles").select("leetcode_username").eq("id", profile_id).single().execute()
    except Exception:
        raise HTTPException(status_code=404, detail="Profile not found") from None
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


def _sync_one(db: Client, profile_id: str, username: str) -> dict:
    """Fetch + upsert one profile's LeetCode stats; returns the stored
    row plus a 'warning' when LeetCode could not be reached or the
    username does not exist (zeros are stored so the UI shows 0)."""
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


@router.post("/sync-all")
def sync_all_stats(
    _lecturer: dict = Depends(require_lecturer),
    db: Client = Depends(get_supabase),
):
    """Lecturer-only bulk sync: link EVERY profile that has a LeetCode
    username to its live LeetCode stats in one call. CampusTrack has no
    public API, so its score stays self-reported - only LeetCode is
    synced here."""
    resp = db.table("profiles").select("id, email, leetcode_username").execute()
    results = []
    for p in resp.data or []:
        username = (p.get("leetcode_username") or "").strip()
        if not username:
            continue
        r = _sync_one(db, p["id"], username)
        results.append(
            {
                "email": p.get("email"),
                "leetcode_username": username,
                "total_solved": r.get("leetcode_total_solved"),
                "warning": r.get("warning"),
            }
        )
    return {"synced": len(results), "results": results}
