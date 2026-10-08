"""Recommendation generation endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from deps import get_current_profile, get_supabase, self_or_lecturer
from services.recommender import generate_plan
from shaping import recommendation_out

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/generate/{profile_id}")
def generate_recommendation(
    profile_id: str,
    profile: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    self_or_lecturer(profile_id, profile)

    prof_resp = db.table("profiles").select("*").eq("id", profile_id).single().execute()
    target = prof_resp.data
    if target is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    stats_resp = db.table("student_stats").select("*").eq("profile_id", profile_id).single().execute()
    stats = stats_resp.data  # may be None

    placements_resp = (
        db.table("placements")
        .select("*")
        .eq("job_field", target.get("target_field") or "")
        .execute()
    )
    placements = placements_resp.data or []

    plan = generate_plan(target, stats, placements)

    row = {
        "profile_id": profile_id,
        "year": plan["year"],
        "recommended_languages": plan["recommended_languages"],
        "focus_areas": plan["focus_areas"],
        "plan": plan["plan"],
    }
    inserted = db.table("recommendations").insert(row).execute()
    created = inserted.data[0] if inserted.data else row
    return recommendation_out(created)


@router.get("/{profile_id}")
def get_latest_recommendation(
    profile_id: str,
    profile: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    self_or_lecturer(profile_id, profile)
    resp = (
        db.table("recommendations")
        .select("*")
        .eq("profile_id", profile_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="No recommendations generated yet")
    return recommendation_out(resp.data[0])
