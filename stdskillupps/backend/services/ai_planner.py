"""AI-backed placement plan generation.

The model is called server-side only. No API key is ever sent to the browser.
"""
from __future__ import annotations

import json
import os

import httpx


class AIPlannerError(RuntimeError):
    """Raised when the configured AI planner cannot produce a plan."""


def _compact(value, limit=12000):
    text = json.dumps(value, ensure_ascii=False, default=str)
    return text[:limit]


def generate_ai_plan(profile: dict, stats: dict | None, placements: list[dict]) -> dict:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("AI_API_KEY")
    if not api_key:
        raise AIPlannerError("AI planner is not configured on the backend yet")

    base = (os.getenv("OPENAI_API_BASE") or "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("OPENAI_MODEL") or "gpt-4o-mini"
    stats = stats or {}
    field = profile.get("target_job_field") or profile.get("target_field") or "SWE"
    year = profile.get("year_of_study") or profile.get("year") or 1

    prompt = f"""Create a practical placement-preparation plan for one Indian BTech CSE student.
Use only the supplied student data. Do not invent scores, achievements, company offers, or completed work.
The plan must adapt to the student's year, target field, LeetCode difficulty split/languages,
and the listed placement roles. It should help the student reach a realistic placement goal.

Student profile: {_compact({'year': year, 'target_field': field, 'name': profile.get('full_name'), 'leetcode_username': profile.get('leetcode_username')})}
LeetCode data: {_compact(stats)}
Placement data: {_compact(placements)}

Return JSON with exactly these keys:
- recommended_languages: array of 2-6 strings
- focus_areas: array of 4-8 short strings
- plan: a readable Markdown plan with a goal, current-gap assessment, a 12-week weekly schedule,
  a realistic daily routine, company/role preparation guidance based on the supplied placements,
  measurable checkpoints, and a weekly review rule.
Mention that recommendations are guidance and that job requirements/packages change.
"""
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a precise placement coach. Return valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    try:
        response = httpx.post(f"{base}/chat/completions", headers=headers, json=body, timeout=90)
        response.raise_for_status()
        payload = response.json()
        content = ((payload.get("choices") or [{}])[0].get("message") or {}).get("content")
        result = json.loads(content or "{}")
    except Exception as exc:
        raise AIPlannerError(f"AI planner request failed: {exc}") from exc

    languages = result.get("recommended_languages")
    focus = result.get("focus_areas")
    plan = result.get("plan")
    if not isinstance(languages, list) or not isinstance(focus, list) or not isinstance(plan, str) or not plan.strip():
        raise AIPlannerError("AI planner returned an incomplete plan")
    return {
        "recommended_languages": [str(x) for x in languages[:6]],
        "focus_areas": [str(x) for x in focus[:8]],
        "plan": plan.strip(),
        "year": int(year) if str(year).isdigit() else 1,
    }
