"""Deterministic placement-readiness recommender. No LLM calls."""
from __future__ import annotations

import datetime
from zoneinfo import ZoneInfo

# Core languages per job field — used as the foundation each year builds on.
# TRAINED values (learned 2026-11-06 from the 15 live placements; counts are real demand).
FIELD_CORE_LANGUAGES: dict[str, list[str]] = {
    "SWE": ["Python", "Java", "C++"],
    "Data Science": ["Python", "SQL", "R"],
    "Frontend": ["JavaScript", "TypeScript"],
    "Backend": ["Java", "SQL", "Go", "C++"],
    "DevOps": ["Python", "Bash", "SQL"],
    "Mobile": ["Kotlin", "Swift", "Java"],
}

FIELD_FOCUS_BASICS: dict[str, list[str]] = {
    "SWE": ["DSA fundamentals", "Big-O notation", "OOP", "System Design basics"],
    "Data Science": ["Statistics", "SQL basics", "Python for data", "ML basics"],
    "Frontend": ["HTML/CSS", "JavaScript basics", "Responsive design", "React basics"],
    "Backend": ["Databases", "REST APIs", "Linux basics", "System Design basics"],
    "DevOps": ["Linux", "Git", "Networking basics", "Docker basics"],
    "Mobile": ["One native platform", "OOP", "REST APIs"],
}

# Normalise case variants coming back from LeetCode languageProblemCount.
_LANG_ALIASES = {
    "cpp": "C++", "c++": "C++",
    "javascript": "JavaScript", "js": "JavaScript",
    "typescript": "TypeScript", "ts": "TypeScript",
    "python3": "Python", "python": "Python",
    "golang": "Go", "go": "Go",
    "kotlin": "Kotlin", "java": "Java",
    "swift": "Swift", "objective-c": "Objective-C",
    "bash": "Bash", "shell": "Bash",
    "sql": "SQL", "r": "R",
}


def _norm_lang(name: str) -> str:
    return _LANG_ALIASES.get(name.strip().lower(), name.strip())


def _language_frequency(placements: list[dict]) -> list[tuple[str, int]]:
    """Languages across placements in the target field, most frequent first."""
    freq: dict[str, int] = {}
    for p in placements:
        for lang in p.get("languages") or []:
            key = _norm_lang(str(lang))
            freq[key] = freq.get(key, 0) + 1
    return sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))


def _coerce_year(value) -> int:
    """Coerce a year value to int. Strings ("2"), floats (2.0) and None are
    all accepted; anything unparseable falls back to year 1 so a malformed
    row can never crash plan generation with a TypeError."""
    if isinstance(value, bool):
        return 1
    if isinstance(value, int):
        return value
    try:
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return 1


# ---------------------------------------------------------------------------
# Exact schedule: the week-by-week "what to do" the student follows.
# Topics run in a fixed proven order; the student starts part-way through
# the sequence when their solved count shows the early topics are done.
# ---------------------------------------------------------------------------
_TOPIC_SEQUENCE = [
    "Arrays & Hashing",
    "Strings & Pattern Matching",
    "Two Pointers & Sliding Window",
    "Stack & Queues",
    "Linked List",
    "Binary Search & Sorting",
    "Trees & BST",
    "Heaps & Priority Queues",
    "Graphs - BFS/DFS & Shortest Path",
    "Backtracking & Recursion",
    "Dynamic Programming I (1D)",
    "Dynamic Programming II (2D) + Mixed Revision",
]

# Rotating weekly skill track per field, alongside the DSA topic.
_FIELD_WEEKLY_SKILLS: dict[str, list[str]] = {
    "SWE": ["OOP concepts", "DBMS + SQL queries", "OS fundamentals", "Computer Networks", "Git + GitHub portfolio", "Resume project sprint"],
    "Data Science": ["SQL practice", "Statistics & Probability", "Pandas + NumPy", "Data Visualisation", "ML basics", "Case-study project"],
    "Frontend": ["HTML/CSS layout drills", "JavaScript DOM projects", "React components", "API integration", "Responsive design", "Portfolio website"],
    "Backend": ["REST API building", "SQL + schema design", "Authentication & JWT", "Caching basics", "Linux + deployment", "System design basics"],
    "DevOps": ["Linux commands", "Git workflows", "Docker basics", "CI/CD pipelines", "Cloud fundamentals", "Monitoring basics"],
    "Mobile": ["Platform UI basics", "REST API integration", "Local storage", "App architecture", "Publishing basics", "Portfolio app sprint"],
}

_YEAR_PACE = {
    1: {"per_day": "3", "days": "Mon-Fri", "daily": ["1 hr: learn the week's topic (video/notes)", "1 hr: solve 3 easy problems in your main language", "30 min: revise yesterday's problems from memory"]},
    2: {"per_day": "4-5", "days": "Mon-Sat", "daily": ["1 hr: topic study + notes", "2 hrs: solve 4-5 problems (easy + medium mix)", "30 min: skill-track work for the week"]},
    3: {"per_day": "6-8", "days": "Mon-Sat", "daily": ["1 hr: weak-topic repair", "2.5 hrs: solve 6-8 problems, medium-first", "1 hr: skill-track / project work", "Sat: one timed contest; Sun: mock interview + revision"]},
    4: {"per_day": "5-6", "days": "Every day", "daily": ["Morning (90 min): 3 problems - 1 easy warm-up + 2 medium, timed", "Afternoon (90 min): 1 hard problem + pattern revision", "Evening (1 hr): mock interview on alternate days, company-specific prep otherwise"]},
}


def _exact_schedule(year: int, field: str, primary_lang: str, total: int) -> list[str]:
    """Week-by-week exact schedule for the next 12 weeks."""
    pace = _YEAR_PACE.get(min(max(year, 1), 4), _YEAR_PACE[2])
    skills = _FIELD_WEEKLY_SKILLS.get(field, _FIELD_WEEKLY_SKILLS["SWE"])

    # Where to start in the topic sequence, from what is already solved.
    if total >= 200:
        start = 8  # revision-level: jump to the hard end + mocks
    elif total >= 60:
        start = 4
    else:
        start = 0
    weeks = []
    for w in range(12):
        topic = _TOPIC_SEQUENCE[(start + w) % len(_TOPIC_SEQUENCE)]
        skill = skills[w % len(skills)]
        weeks.append(
            f"- **Week {w + 1}: {topic}** - {pace['per_day']} problems/day ({pace['days']}) in {primary_lang}; skill track: {skill}."
        )
    if year >= 4:
        weeks[10] = "- **Week 11: Company-tagged sprint** - only problems from your target companies' past papers, timed."
        weeks[11] = "- **Week 12: Mock week** - one full mock interview daily + HR/behavioural stories ready."

    lines = [
        "",
        "## Your exact schedule - start this week",
        f"Main language: **{primary_lang}**. Pace: **{pace['per_day']} problems/day** ({pace['days']}).",
        "",
        "### Daily timetable",
    ]
    lines += [f"- {block}" for block in pace["daily"]]
    lines += ["", "### Week by week (12 weeks)"]
    lines += weeks
    lines += [
        "",
        "### Rules that make it work",
        "- Never break the chain two days in a row - a light day still counts (1 problem + revision).",
        "- Every Sunday: re-solve the week's 5 hardest problems from scratch, no notes.",
        "- Finish a week only when you can explain each pattern out loud; otherwise repeat the week.",
    ]
    return lines



def generate_plan(profile: dict, stats: dict | None, placements: list[dict]) -> dict:
    """Build a year-based study plan.

    profile: row from profiles (year_of_study/year, target_job_field/target_field).
    Both the frontend alias names and the canonical DB column names are accepted.
    stats: row from student_stats or None
    placements: placement rows for the profile's target field
    """
    stats = stats or {}
    # Accept both frontend aliases (year_of_study, target_job_field) and
    # canonical DB columns (year, target_field).
    field = profile.get("target_job_field") or profile.get("target_field") or "SWE"
    raw_year = profile.get("year_of_study")
    if raw_year is None:
        raw_year = profile.get("year")
    # Clamp the lower bound: year 0 / negative / garbage all mean "year 1"
    # (matches the previous `or 1` fallback for falsy values).
    year = max(1, _coerce_year(raw_year)) if raw_year is not None else 1

    freq = _language_frequency(placements)
    placement_langs = [lang for lang, _ in freq]  # union by demand frequency
    core_langs = FIELD_CORE_LANGUAGES.get(field, FIELD_CORE_LANGUAGES["SWE"])
    basics = FIELD_FOCUS_BASICS.get(field, FIELD_FOCUS_BASICS["SWE"])

    # Languages the student already practices (normalised), most-practiced first.
    known_langs = sorted(
        (_norm_lang(k) for k in (stats.get("language_stats") or {}).keys()),
        key=lambda k: -((stats.get("language_stats") or {}).get(
            next((o for o in (stats.get("language_stats") or {}) if _norm_lang(o) == k), ""),
            0,
        )),
    )
    known_set = set(known_langs)

    total = stats.get("leetcode_total_solved", 0) or 0
    easy = stats.get("leetcode_easy", 0) or 0
    medium = stats.get("leetcode_medium", 0) or 0
    hard = stats.get("leetcode_hard", 0) or 0

    plan_lines: list[str] = []
    recommended_languages: list[str] = []
    focus_areas: list[str] = []

    def _per_job_groups() -> str:
        lines = []
        for p in placements:
            langs = [_norm_lang(str(x)) for x in (p.get("languages") or [])]
            missing = [x for x in langs if x not in known_set]
            covered = [x for x in langs if x in known_set]
            line = f"- **For {p.get('company')} ({p.get('role')})**: requires {', '.join(langs) or 'n/a'}."
            if missing:
                line += f" Work on: {', '.join(missing)}."
            elif covered:
                line += " Already covered by your practice — keep sharp."
            lines.append(line)
        return "\n".join(lines) or "_No placements found for this field yet._"

    # ------------------------------------------------------------------ Year 1
    if year <= 1:
        recommended_languages = core_langs
        focus_areas = basics
        plan_lines = [
            f"# Year 1 plan — {field} (fundamentals)",
            "",
            "Goal: build unshakeable foundations. No rush into advanced topics.",
            "",
            "## Core languages to learn",
            "\n".join(f"- {lang}" for lang in core_langs),
            "",
            "## Focus areas",
            "\n".join(f"- {a}" for a in basics),
            "",
            "## Weekly routine (relaxed pace)",
            "- 3 days coding (easy DSA, 3–5 problems/day)",
            "- 2 days theory (one core subject: OS/DBMS/CN)",
            "- 1 day project work (small CLI or web project)",
            "- 1 day rest + revision",
            "",
            "## Milestones",
            "- Month 3: comfortable in 1 language, 100+ easy problems",
            "- Month 6: started OOP + one project on GitHub",
            "- Month 12: 200+ easy + 50 medium, 2 portfolio projects",
        ]

    # ------------------------------------------------------------------ Year 2
    elif year == 2:
        # Compare practice vs placement demand; recommend specific core languages.
        demand = placement_langs or core_langs
        weak = [lang for lang in demand if lang not in known_set]
        recommended_languages = (weak + [l for l in demand if l in known_set])[:6] or core_langs
        focus_areas = basics + ["Medium DSA", "Projects", "Internship prep"]

        plan_lines = [
            f"# Year 2 plan — {field} (build & compare)",
            "",
            f"Current LeetCode: **{total} solved** (easy {easy} / medium {medium} / hard {hard}).",
            "",
            "## Core languages to work on (from placement demand)",
            "\n".join(
                f"- {lang}" + ("" if lang in known_set else " — **needs work**")
                for lang in recommended_languages
            ),
            "",
            "## Target placements — language fit",
            _per_job_groups(),
            "",
            "## Weekly routine",
            "- 4 days DSA (easy + medium, 4–6 problems/day)",
            "- 2 days core subjects + one language deep-dive",
            "- 1 day project / open-source contribution",
            "",
            "## Milestones",
            "- Month 3: 150+ medium problems, medium comfort in top 2 languages",
            "- Month 6: internship-ready resume, 1 strong project",
            "- Month 12: target **300+ total solved** (mostly medium)",
        ]

    # ------------------------------------------------------------------ Year 3
    elif year == 3:
        recommended_languages = (placement_langs or core_langs)[:6]
        focus_areas = ["Medium/Hard DSA", "System Design basics", "Mock interviews", "Internships"]

        plan_lines = [
            f"# Year 3 plan — {field} (accelerated training)",
            "",
            f"Current LeetCode: **{total} solved** (easy {easy} / medium {medium} / hard {hard}).",
            "Pace picks up: you are training for placement season now.",
            "",
            "## Priority languages",
            "\n".join(f"- {lang}" for lang in recommended_languages),
            "",
            "## Weekly targets",
            "- 5 days DSA: 6–8 problems/day, **medium-first**, 2 hard/week",
            "- 2 days: system design / domain depth (HLD basics, SQL mastery)",
            "- Weekend: 1 mock interview + 1 contest (Codeforces/LeetCode weekly)",
            "",
            "## Focus areas",
            "\n".join(f"- {a}" for a in focus_areas),
            "",
            "## Milestones",
            "- Month 3: 400+ solved, 100+ hard attempted, first internship",
            "- Month 6: comfortable with HLD basics + 2 strong projects",
            "- Month 12: placement-ready; weekly mocks until offers",
        ]

    # ------------------------------------------------------------------ Year 4
    else:
        recommended_languages = (placement_langs or core_langs)[:5]
        focus_areas = ["Interview revision", "Hard DSA sprints", "HR + behavioral", "Offer negotiation"]

        plan_lines = [
            f"# Year 4 plan — {field} (intensive: placement season)",
            "",
            f"Current LeetCode: **{total} solved** (easy {easy} / medium {medium} / hard {hard}).",
            "This is sprint mode: every day counts. Revise, don't learn from scratch.",
            "",
            "## Priority languages",
            "\n".join(f"- {lang}" for lang in recommended_languages),
            "",
            "## Daily targets",
            "- Morning: 3 problems (1 easy warm-up, 2 medium) in 90 min",
            "- Afternoon: 1 hard + pattern revision (sliding window, DP, graphs...)",
            "- Evening: 1 mock interview every 2 days + company-specific prep",
            "",
            "## Revision sprints",
            "- Sprint 1 (2 weeks): DSA patterns you are weak in",
            "- Sprint 2 (2 weeks): company-tagged problems for target companies",
            "- Sprint 3 (ongoing): mock interviews + behavioral stories",
            "",
            "## Target placements — last-mile language check",
            _per_job_groups(),
            "",
            "## Focus areas",
            "\n".join(f"- {a}" for a in focus_areas),
        ]

    # Every plan ends with the exact week-by-week schedule.
    primary_lang = known_langs[0] if known_langs else (recommended_languages[0] if recommended_languages else "your main language")
    plan_lines += _exact_schedule(year, field, primary_lang, total)

    return {
        "year": year,
        "recommended_languages": recommended_languages,
        "focus_areas": focus_areas,
        "plan": "\n".join(plan_lines),
    }


# ---------------------------------------------------------------------------
# Adaptive company-targeted planner (key-free, deterministic).
# Added 2026-11-17 from Qwen's bundle, fixed to the live code:
# - lives in services/recommender.py (not backend/recommender.py)
# - reads the live stats columns (leetcode_total_solved, ...)
# - the trained field planner above (generate_plan) is kept intact
# ---------------------------------------------------------------------------

COMPANY_TIERS: dict[str, dict] = {
    "Amazon": {"tier": 1, "target": 350, "easy": 100, "med": 200, "hard": 50, "extras": ["System Design", "Graphs", "DP"]},
    "Microsoft": {"tier": 1, "target": 320, "easy": 90, "med": 180, "hard": 50, "extras": ["System Design", "Trees", "DP"]},
    "Google": {"tier": 1, "target": 400, "easy": 100, "med": 230, "hard": 70, "extras": ["Graphs", "DP", "Tries"]},
    "Adobe": {"tier": 2, "target": 250, "easy": 80, "med": 140, "hard": 30, "extras": ["Arrays", "Strings", "DP"]},
    "TCS Digital": {"tier": 2, "target": 200, "easy": 70, "med": 110, "hard": 20, "extras": ["Arrays", "Strings", "DBMS"]},
    "Infosys PP": {"tier": 2, "target": 200, "easy": 70, "med": 110, "hard": 20, "extras": ["Arrays", "DBMS", "SQL"]},
    "TCS Ninja": {"tier": 3, "target": 120, "easy": 60, "med": 50, "hard": 10, "extras": ["Arrays", "Strings", "Aptitude"]},
    "Wipro": {"tier": 3, "target": 100, "easy": 55, "med": 40, "hard": 5, "extras": ["Aptitude", "Arrays"]},
    "Accenture": {"tier": 3, "target": 100, "easy": 55, "med": 40, "hard": 5, "extras": ["Aptitude", "Arrays"]},
    "Cognizant": {"tier": 3, "target": 100, "easy": 55, "med": 40, "hard": 5, "extras": ["Aptitude", "Arrays"]},
}
TIER_LABEL = {1: "Dream", 2: "Top", 3: "Core"}

# NOTE: company targets are starting values supplied by Qwen (2026-11-17),
# NOT measured from the placements table (which has no score column).
# The owner can retune them here; the planner reads only this table.

FOUNDATION_TOPICS = ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Strings"]
INTERMEDIATE_TOPICS = ["Stack", "Binary Search", "Linked List", "Trees", "Heap"]
ADVANCED_TOPICS = ["Tries", "Backtracking", "Graphs", "Dynamic Programming", "System Design"]
_ADAPTIVE_YEAR_PACE = {1: 3, 2: 5, 3: 7, 4: 6}


def today_ist() -> datetime.date:
    """Today's date in Asia/Kolkata (the owner's timezone)."""
    return datetime.datetime.now(ZoneInfo("Asia/Kolkata")).date()


def weeks_until_placement(year: int) -> int:
    """Whole weeks from today until 4th-year placements (1 August).

    Year 4 is special: placements are THIS year, so the runway ends at
    the close of placement season (1 December) instead of next August,
    which would run past graduation.
    """
    today = today_ist()
    if year >= 4:
        target = datetime.date(today.year, 12, 1)
        if target <= today:
            target = datetime.date(today.year + 1, 8, 1)
        return max(4, (target - today).days // 7)
    years_left = max(0, 4 - year)
    target = datetime.date(today.year + years_left, 8, 1)
    if target <= today:
        target = datetime.date(today.year + 1, 8, 1)
    return max(4, (target - today).days // 7)


def current_week_for(created_at, weeks_total: int) -> int:
    """Which week of the plan we are in (1-based), from the plan's
    creation timestamp. Mirrors the dashboard hero's maths."""
    try:
        if isinstance(created_at, str):
            created = datetime.datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        else:
            created = created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=datetime.timezone.utc)
        now = datetime.datetime.now(datetime.timezone.utc)
        week = (now - created).days // 7 + 1
    except Exception:
        week = 1
    return max(1, min(weeks_total, week))


def compute_gap(current: int, target: int) -> tuple[str, int]:
    if current >= target:
        return "READY", 0
    ratio = current / target if target else 0
    if ratio >= 0.8:
        return "NEARLY THERE", target - current
    if ratio >= 0.5:
        return "ON TRACK", target - current
    if ratio >= 0.2:
        return "BUILDING UP", target - current
    return "EARLY STAGE", target - current


def compute_status(completion_pct: float, active_days: int, gap_ratio: float) -> str:
    if completion_pct >= 80 and active_days >= 5:
        return "AHEAD"
    if completion_pct < 30 or active_days <= 1:
        return "BEHIND"
    if gap_ratio > 0.8:
        return "ON TRACK"
    return "STEADY"


def build_schedule(weeks_total: int, year: int, aim: dict, status: str) -> list[dict]:
    """Week-by-week topic rotation until placements.

    Phases: first 40% Foundation, next 35% Intermediate, rest Advanced.
    The status actually changes the pace now (Qwen's version computed it
    but never used it): AHEAD adds one problem a day; BEHIND keeps the
    pace and opens with a revision/catch-up week.
    """
    pace = _ADAPTIVE_YEAR_PACE.get(year, 4)
    daily_pace = pace + 1 if status == "AHEAD" else pace
    f_end = int(weeks_total * 0.40)
    i_end = int(weeks_total * 0.75)
    schedule = []
    for w in range(1, weeks_total + 1):
        if status == "BEHIND" and w == 1:
            topic, phase = "Revision & catch-up", "Catch-up"
        elif w <= f_end:
            topic = FOUNDATION_TOPICS[(w - 1) % len(FOUNDATION_TOPICS)]
            phase = "Foundation"
        elif w <= i_end:
            topic = INTERMEDIATE_TOPICS[(w - f_end - 1) % len(INTERMEDIATE_TOPICS)]
            phase = "Intermediate"
        else:
            topic = ADVANCED_TOPICS[(w - i_end - 1) % len(ADVANCED_TOPICS)]
            phase = "Advanced"
        schedule.append({"week": w, "phase": phase, "topic": topic, "weekly_target": daily_pace * 6, "daily_pace": daily_pace})
    return schedule


def generate_adaptive_plan(profile: dict, stats: dict | None, recent_activity: list[dict]) -> tuple[str, dict]:
    """Company-targeted adaptive plan. Pure + deterministic: same inputs,
    same plan. Returns (plan_text, meta); meta carries the DB row fields
    (year / languages / focus areas) the router stores.
    """
    stats = stats or {}
    raw_year = profile.get("year_of_study")
    if raw_year is None:
        raw_year = profile.get("year")
    year = max(1, _coerce_year(raw_year))

    field = profile.get("target_job_field") or profile.get("target_field") or "SWE"
    aim_name = (profile.get("aim_company") or "TCS Ninja").strip()
    aim = COMPANY_TIERS.get(aim_name)
    if aim is None:
        aim_name, aim = "TCS Ninja", COMPANY_TIERS["TCS Ninja"]

    # Live stats rows use leetcode_* columns; accept the frontend aliases too.
    current_total = int(stats.get("leetcode_total_solved", stats.get("total_solved", 0)) or 0)
    easy = int(stats.get("leetcode_easy", stats.get("easy_solved", 0)) or 0)
    medium = int(stats.get("leetcode_medium", stats.get("medium_solved", 0)) or 0)
    hard = int(stats.get("leetcode_hard", stats.get("hard_solved", 0)) or 0)
    target_total = aim["target"]
    gap_label, gap_remaining = compute_gap(current_total, target_total)
    weeks_total = weeks_until_placement(year)

    recent_activity = recent_activity or []
    active_days = len([a for a in recent_activity if (a.get("problems_solved", 0) or 0) > 0 or (a.get("tasks_completed", 0) or 0) > 0])
    completion_pct = (len([a for a in recent_activity if (a.get("tasks_completed", 0) or 0) >= 3]) / max(1, len(recent_activity))) * 100
    gap_ratio = current_total / target_total if target_total else 0
    status = compute_status(completion_pct, active_days, gap_ratio)

    schedule = build_schedule(weeks_total, year, aim, status)
    pace = schedule[0]["daily_pace"] if schedule else _ADAPTIVE_YEAR_PACE.get(year, 4)

    lines = []
    lines.append(f"# Your {aim_name} Placement Plan — {TIER_LABEL[aim['tier']]} Tier")
    lines.append(f"**Aim:** {aim_name}  •  **Year:** {year}  •  **Weeks left:** {weeks_total}")
    lines.append(f"**Status:** {status}  •  **Gap:** {gap_label} ({gap_remaining} problems to go)")
    lines.append(f"**Target:** {target_total} total  (Easy {aim['easy']} · Med {aim['med']} · Hard {aim['hard']})")
    lines.append(f"**Current:** {current_total} total (Easy {easy} · Med {medium} · Hard {hard})\n")
    if gap_label == "READY":
        lines.append("Target reached — this plan keeps you sharp with revision and mocks until placements.\n")
    if status == "AHEAD":
        lines.append(f"You're ahead of your plan — pace raised to {pace} problems/day.\n")
    if status == "BEHIND":
        lines.append("You're behind — this week is revision & catch-up, and unfinished tasks carry forward.\n")
    lines.append("## Your schedule until 4th-year placements")
    for s in schedule:
        lines.append(f"**Week {s['week']}: {s['topic']}**  _({s['phase']})_")
        lines.append(f"- Daily pace: {s['daily_pace']} problems/day, 6 days/week → {s['weekly_target']}/week")
        if s["topic"] in aim["extras"]:
            lines.append(f"- Focus area for {aim_name}: {s['topic']}")
        lines.append("")
    lines.append("## Your exact schedule")
    lines.append("- Morning: 45 min theory of the week's topic.")
    lines.append(f"- Afternoon: Solve {pace} LeetCode problems in your core language.")
    lines.append("- Evening: Review mistakes + mark today's tasks done.")
    lines.append("- Weekend: 1 mock interview / revision of the week.")
    lines.append("\n_Plan regenerates from your live LeetCode score. Keep syncing to stay on track._")

    meta = {
        "status": status, "gap_label": gap_label, "gap_remaining": gap_remaining,
        "target": target_total, "current": current_total,
        "weeks_left": weeks_total, "tier": aim["tier"], "aim": aim_name,
        "year": year,
        "recommended_languages": FIELD_CORE_LANGUAGES.get(field, FIELD_CORE_LANGUAGES["SWE"]),
        "focus_areas": list(aim["extras"]),
    }
    return "\n".join(lines), meta


def get_daily_tasks_for_today(plan_text: str, aim: dict, year: int, current_week: int) -> list[dict]:
    """Today's tasks for the CURRENT week of the plan (not week 1).

    Qwen's version broke after the first '**Week ' line, so it always
    returned week 1. This one finds the line for current_week.
    """
    topic = FOUNDATION_TOPICS[0]
    week = 1
    for line in plan_text.split("\n"):
        if line.startswith("**Week "):
            try:
                w = int(line.split(":")[0].replace("**Week ", "").strip())
                t = line.split(":", 1)[1].split("**")[0].strip()
            except (ValueError, IndexError):
                continue
            if w == current_week:
                week, topic = w, t
                break
            if w == 1:
                week, topic = 1, t  # fallback: first week in the text
    pace = _ADAPTIVE_YEAR_PACE.get(year, 4)
    tasks = [
        {"week": week, "topic": topic, "task_description": f"Solve {pace} {topic} problems on LeetCode"},
        {"week": week, "topic": topic, "task_description": f"45-min theory revision of {topic}"},
    ]
    if topic in aim.get("extras", []):
        tasks.append({"week": week, "topic": topic, "task_description": f"Deep-dive: {topic} (key for {aim.get('aim', 'your aim company')})"})
    return tasks
