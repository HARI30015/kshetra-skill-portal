"""Deterministic placement-readiness recommender. No LLM calls."""
from __future__ import annotations

# Core languages per job field — used as the foundation each year builds on.
FIELD_CORE_LANGUAGES: dict[str, list[str]] = {
    "SWE": ["C++", "Java", "Python"],
    "Data Science": ["Python", "SQL", "R"],
    "Frontend": ["JavaScript", "TypeScript"],
    "Backend": ["Java", "Python", "Go", "SQL"],
    "DevOps": ["Python", "Bash"],
    "Mobile": ["Kotlin", "Swift"],
}

FIELD_FOCUS_BASICS: dict[str, list[str]] = {
    "SWE": ["DSA fundamentals", "Big-O notation", "OOP"],
    "Data Science": ["Statistics", "SQL basics", "Python for data"],
    "Frontend": ["HTML/CSS", "JavaScript basics", "Responsive design"],
    "Backend": ["Databases", "REST APIs", "Linux basics"],
    "DevOps": ["Linux", "Git", "Networking basics"],
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

    profile: row from profiles (year_of_study/year, target_job_field/target_field,
    campustrack_score, ...). Both the frontend alias names and the canonical
    DB column names are accepted.
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
    campustrack_score = profile.get("campustrack_score")

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

        score_line = (
            f"CampusTrack score: {campustrack_score}."
            if campustrack_score is not None
            else "CampusTrack score: not linked yet — link it for tighter guidance."
        )
        plan_lines = [
            f"# Year 2 plan — {field} (build & compare)",
            "",
            f"Current LeetCode: **{total} solved** (easy {easy} / medium {medium} / hard {hard}).",
            score_line,
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
