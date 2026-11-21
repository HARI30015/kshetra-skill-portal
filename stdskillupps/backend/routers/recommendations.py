"""Recommendation generation endpoints (adaptive, key-free).

The plan generator is deterministic and rule-based: no LLM, no paid
keys. POST /generate/{profile_id} rebuilds the plan from the student's
live LeetCode score, aim company and last-7-days activity; the dashboard
Regenerate button calls it.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from deps import get_current_profile, get_supabase, self_or_lecturer
from services.recommender import (
    COMPANY_TIERS,
    FOUNDATION_TOPICS,
    current_week_for,
    generate_adaptive_plan,
    get_daily_tasks_for_today,
    today_ist,
    week_topic_for,
)
from services.problem_bank import TOPIC_LIST, today_problems, week_problems
from shaping import recommendation_out

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def _load_activity(db: Client, profile_id: str) -> list[dict]:
    """Last 7 days of daily_activity. Empty list when the table is not
    there yet (migration pending) — the plan still generates."""
    seven_days_ago = (today_ist() - timedelta(days=7)).isoformat()
    try:
        resp = (
            db.table("daily_activity")
            .select("*")
            .eq("profile_id", profile_id)
            .gte("date", seven_days_ago)
            .execute()
        )
    except Exception:
        return []
    return resp.data or []


def _load_stats(db: Client, profile_id: str) -> dict:
    try:
        resp = db.table("student_stats").select("*").eq("profile_id", profile_id).single().execute()
        return resp.data or {}
    except Exception:
        return {}


def _refresh_today_tasks(db, profile_id, plan_text, aim_name, year, weeks_total, created_at):
    """Rebuild today's task list. Missed work CARRIES FORWARD: only
    incomplete tasks older than 7 days are dropped; today's list is
    added only when none exists yet today."""
    today = today_ist()
    week_ago = (today - timedelta(days=7)).isoformat()
    try:
        db.table("plan_tasks").delete().eq("profile_id", profile_id).eq("is_completed", False).lt("created_at", week_ago).execute()
    except Exception:
        pass
    try:
        existing = (
            db.table("plan_tasks")
            .select("id")
            .eq("profile_id", profile_id)
            .eq("is_completed", False)
            .gte("created_at", today.isoformat())
            .execute()
            .data
            or []
        )
    except Exception:
        existing = []
    if existing:
        return
    aim = COMPANY_TIERS.get(aim_name) or COMPANY_TIERS["TCS Ninja"]
    current_week = current_week_for(created_at, weeks_total)
    for t in get_daily_tasks_for_today(plan_text, {**aim, "aim": aim_name}, year, current_week):
        try:
            db.table("plan_tasks").insert({**t, "profile_id": profile_id}).execute()
        except Exception:
            pass


@router.post("/generate/{profile_id}")
def generate_recommendation(
    profile_id: str,
    profile: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    self_or_lecturer(profile_id, profile)

    # .single() raises (PGRST116) when no row matches — convert to 404
    # instead of letting it surface as a 500. Same for student_stats below.
    try:
        prof_resp = db.table("profiles").select("*").eq("id", profile_id).single().execute()
    except Exception:
        raise HTTPException(status_code=404, detail="Profile not found") from None
    target = prof_resp.data
    if target is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    stats = _load_stats(db, profile_id)
    activity = _load_activity(db, profile_id)
    plan_text, meta = generate_adaptive_plan(target, stats, activity)

    row = {
        "profile_id": profile_id,
        "year": meta["year"],
        "recommended_languages": meta["recommended_languages"],
        "focus_areas": meta["focus_areas"],
        "plan": plan_text,
    }
    inserted = db.table("recommendations").insert(row).execute()
    created = inserted.data[0] if inserted.data else row
    _refresh_today_tasks(
        db, profile_id, plan_text, meta["aim"], meta["year"], meta["weeks_left"], created.get("created_at")
    )
    return recommendation_out(created)


@router.get("/me/today")
def get_today_tasks(
    profile: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    """Today's unfinished tasks + live plan meta (status/gap), so the
    dashboard card never shows a stale 'Syncing' badge. Also the
    problems for today and this week, drawn from the verified problem
    bank and divided per placement: the week's topic comes from the
    student's own plan, and a focus topic for their aim company gets
    harder problems and one extra a day.
    """
    pid = profile["id"]
    stats = _load_stats(db, pid)
    activity = _load_activity(db, pid)
    _, meta = generate_adaptive_plan(profile, stats, activity)
    try:
        tasks = (
            db.table("plan_tasks")
            .select("*")
            .eq("profile_id", pid)
            .eq("is_completed", False)
            .order("created_at")
            .limit(5)
            .execute()
            .data
            or []
        )
    except Exception:
        tasks = []
    problems = {"week": None, "week_topic": None, "focus": False, "today": [], "week_problems": {}}
    try:
        rec = (
            db.table("recommendations")
            .select("plan,created_at")
            .eq("profile_id", pid)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
            .data
            or []
        )
        if rec:
            plan_text = rec[0].get("plan") or ""
            current_week = current_week_for(rec[0].get("created_at"), meta.get("weeks_left") or 1)
            week, topic = week_topic_for(plan_text, current_week)
            # A catch-up week has no topic in the bank — revise the
            # foundation topic instead of showing nothing.
            if topic not in TOPIC_LIST:
                topic = FOUNDATION_TOPICS[0]
            aim = COMPANY_TIERS.get(meta.get("aim") or "TCS Ninja") or COMPANY_TIERS["TCS Ninja"]
            focus = topic in aim.get("extras", [])
            pace = meta.get("daily_pace") or 4
            day_index = min(today_ist().weekday(), 5)  # 6-day week; Sunday repeats Saturday's set
            problems = {
                "week": week,
                "week_topic": topic,
                "focus": focus,
                "today": today_problems(topic, week, day_index, pace, focus),
                "week_problems": week_problems(topic, week, pace, focus),
            }
    except Exception:
        pass
    return {"tasks": tasks, "meta": meta, "problems": problems}


@router.post("/me/today/{task_id}/complete")
def complete_today_task(
    task_id: str,
    profile: dict = Depends(get_current_profile),
    db: Client = Depends(get_supabase),
):
    pid = profile["id"]
    try:
        task_resp = db.table("plan_tasks").select("*").eq("id", task_id).single().execute()
    except Exception:
        raise HTTPException(status_code=404, detail="Task not found") from None
    task = task_resp.data
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.get("profile_id") != pid:
        raise HTTPException(status_code=403, detail="Not authorized for this task")
    if task.get("is_completed"):
        return {"status": "completed"}
    db.table("plan_tasks").update(
        {"is_completed": True, "completed_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", task_id).eq("profile_id", pid).execute()

    today = today_ist().isoformat()
    try:
        existing = db.table("daily_activity").select("*").eq("profile_id", pid).eq("date", today).execute().data or []
    except Exception:
        existing = []
    if existing:
        db.table("daily_activity").update(
            {"tasks_completed": (existing[0].get("tasks_completed") or 0) + 1}
        ).eq("profile_id", pid).eq("date", today).execute()
    else:
        try:
            db.table("daily_activity").insert(
                {"profile_id": pid, "date": today, "tasks_completed": 1, "problems_solved": 0, "login_count": 0}
            ).execute()
        except Exception:
            pass
    return {"status": "completed"}


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
