"""Response shaping + input aliasing.

The database uses the canonical column names from supabase/schema.sql
(year, target_field, campustrack_username, leetcode_total_solved, ...,
updated_at, plan). The frontend reads a friendlier contract
(year_of_study, target_job_field, campus_track_username, total_solved,
easy_solved, medium_solved, hard_solved, synced_at, plan_text).

These helpers translate both ways: every response carries BOTH the canonical
column name and the frontend alias, and profile updates accept either name.
"""
from __future__ import annotations

# frontend_key -> db_column (only for keys that differ)
PROFILE_IN_ALIASES: dict[str, str] = {
    "year_of_study": "year",
    "target_job_field": "target_field",
    "campus_track_username": "campustrack_username",
    "campus_track_score": "campustrack_score",
}

PROFILE_OUT_ALIASES: dict[str, str] = {
    "year": "year_of_study",
    "target_field": "target_job_field",
    "campustrack_username": "campus_track_username",
    "campustrack_score": "campus_track_score",
}

PROFILE_FIELDS = {
    "full_name", "role", "email", "year", "target_field",
    "leetcode_username", "campustrack_username", "campustrack_score",
    "onboarded",
}


def normalize_profile_update(data: dict) -> dict:
    """Map frontend field names to DB columns; drop unknown keys."""
    out: dict[str, str | int | float | bool | None] = {}
    for key, value in data.items():
        column = PROFILE_IN_ALIASES.get(key, key)
        if column in PROFILE_FIELDS and value is not None:
            out[column] = value
    return out


def profile_out(row: dict) -> dict:
    """DB profile row + frontend alias keys."""
    shaped = dict(row)
    for column, alias in PROFILE_OUT_ALIASES.items():
        shaped.setdefault(alias, row.get(column))
    return shaped


def stats_out(row: dict) -> dict:
    """DB student_stats row + frontend alias keys."""
    shaped = dict(row)
    shaped.setdefault("total_solved", row.get("leetcode_total_solved"))
    shaped.setdefault("easy_solved", row.get("leetcode_easy"))
    shaped.setdefault("medium_solved", row.get("leetcode_medium"))
    shaped.setdefault("hard_solved", row.get("leetcode_hard"))
    shaped.setdefault("synced_at", row.get("updated_at"))
    return shaped


def recommendation_out(row: dict) -> dict:
    """DB recommendation row + frontend alias keys."""
    shaped = dict(row)
    shaped.setdefault("plan_text", row.get("plan"))
    return shaped
