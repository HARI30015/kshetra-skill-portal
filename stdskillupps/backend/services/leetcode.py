"""Fetch public LeetCode stats for a username via the GraphQL API."""
import httpx

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

_QUERY = """
query userStats($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    languageProblemCount {
      languageName
      problemsSolved
    }
  }
}
"""

ZEROES = {"total": 0, "easy": 0, "medium": 0, "hard": 0, "language_stats": {}}


def fetch_leetcode_stats(username: str) -> dict:
    """Return {total, easy, medium, hard, language_stats}.

    On user-not-found / network errors returns zeros with an ``error`` flag
    instead of raising, so profile syncs degrade gracefully.
    """
    if not username:
        return {**ZEROES, "error": "no leetcode username on profile"}

    try:
        resp = httpx.post(
            LEETCODE_GRAPHQL_URL,
            json={"query": _QUERY, "variables": {"username": username}},
            headers={
                "Content-Type": "application/json",
                "Referer": f"https://leetcode.com/u/{username}/",
                "User-Agent": "stdskillupps/0.1",
            },
            timeout=20,
        )
        resp.raise_for_status()
        payload = resp.json()
    except Exception as exc:
        return {**ZEROES, "error": f"leetcode request failed: {exc}"}

    matched = (payload.get("data") or {}).get("matchedUser")
    if matched is None:
        return {**ZEROES, "error": f"leetcode user '{username}' not found"}

    counts = {"Easy": 0, "Medium": 0, "Hard": 0, "All": 0}
    for item in ((matched.get("submitStatsGlobal") or {}).get("acSubmissionNum") or []):
        if item.get("difficulty") in counts:
            counts[item["difficulty"]] = item.get("count", 0) or 0

    language_stats = {}
    for item in matched.get("languageProblemCount") or []:
        name = item.get("languageName")
        if name:
            language_stats[name] = item.get("problemsSolved", 0) or 0

    return {
        "total": counts["All"],
        "easy": counts["Easy"],
        "medium": counts["Medium"],
        "hard": counts["Hard"],
        "language_stats": language_stats,
    }
