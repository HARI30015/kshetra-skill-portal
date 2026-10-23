"""CampusTrack bookmarklet sync.

CampusTrack is a closed, sign-in-only system: no public profiles, no
API (verified live 2026-10-22/23). The only honest sync channel is
the student's own browser - while the student is logged into
CampusTrack, a bookmarklet (a bookmark whose URL is a small script)
reads their total score off their own profile page and posts it here
with their personal sync key.

The key is HMAC-SHA256(profile_id, CT_SYNC_SECRET), truncated -
deterministic, so nothing extra is stored in the database.
CT_SYNC_SECRET lives only in the host environment; while it is unset
every sync route answers 503.
"""
import hashlib
import hmac
import json
import os
import secrets

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel
from supabase import Client

from deps import get_supabase

router = APIRouter(tags=["campustrack-sync"])

CT_ORIGIN = "https://vardhaman.campustrack.in"
API_BASE = "https://stdskillupps-api.onrender.com"


def _secret() -> str:
    return os.environ.get("CT_SYNC_SECRET", "")


def sync_key_for(profile_id: str) -> str:
    secret = _secret()
    if not secret:
        return ""
    return hmac.new(secret.encode(), str(profile_id).encode(), hashlib.sha256).hexdigest()[:40]


def _key_ok(profile_id: str, key: str) -> bool:
    expected = sync_key_for(profile_id)
    return bool(expected) and secrets.compare_digest(key or "", expected)


def _cors() -> dict:
    return {
        "Access-Control-Allow-Origin": CT_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin",
    }


class CtSyncIn(BaseModel):
    profile_id: str
    key: str
    score: int


@router.options("/campustrack-sync")
def campustrack_sync_preflight():
    return JSONResponse(content={}, headers=_cors())


@router.post("/campustrack-sync")
def campustrack_sync(body: CtSyncIn, db: Client = Depends(get_supabase)):
    if not _secret():
        return JSONResponse(status_code=503, content={"ok": False, "detail": "CampusTrack sync is not configured"}, headers=_cors())
    if not _key_ok(body.profile_id, body.key):
        return JSONResponse(status_code=403, content={"ok": False, "detail": "Invalid sync key"}, headers=_cors())
    if body.score < 0 or body.score > 1000000:
        return JSONResponse(status_code=400, content={"ok": False, "detail": "Score out of range"}, headers=_cors())
    updated = (
        db.table("profiles")
        .update({"campustrack_score": body.score})
        .eq("id", body.profile_id)
        .execute()
    )
    if not updated.data:
        return JSONResponse(status_code=404, content={"ok": False, "detail": "Profile not found"}, headers=_cors())
    return JSONResponse(content={"ok": True, "score": body.score}, headers=_cors())


_SCRIPT = r"""(function () {
  var PID = %PID%, KEY = %KEY%, API = %API%;
  function pageText() {
    return ((document.body && document.body.innerText) || '').replace(/\s+/g, ' ');
  }
  function findScore() {
    var t = pageText();
    var m = t.match(/([\d,]{2,})\s*total score/i);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
    m = t.match(/total score[^0-9]{0,25}([\d,]{2,})/i);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
    return null;
  }
  function send(score) {
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: PID, key: KEY, score: score })
    }).then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) alert('stdskillupps: your CampusTrack score (' + d.score + ') is synced.');
        else alert('stdskillupps sync failed: ' + ((d && d.detail) || 'unknown error'));
      })
      .catch(function () { alert('stdskillupps sync failed: could not reach the server.'); });
  }
  var s = findScore();
  if (s !== null) { send(s); return; }
  if (!/\/profile/.test(location.pathname)) {
    alert('stdskillupps: taking you to your CampusTrack profile - click the "Sync to stdskillupps" bookmark once more when it opens.');
    location.href = '/profile';
    return;
  }
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    var v = findScore();
    if (v !== null) { clearInterval(iv); send(v); }
    else if (tries >= 24) {
      clearInterval(iv);
      alert('stdskillupps: could not find your score on this page. Open your CampusTrack Profile page and click the bookmark again.');
    }
  }, 500);
})();"""


@router.get("/campustrack-sync.js")
def campustrack_sync_script(pid: str = "", k: str = ""):
    if not _key_ok(pid, k):
        js = "alert('stdskillupps: this sync bookmark is invalid. Get a fresh one from your stdskillupps dashboard.');"
        return PlainTextResponse(js, media_type="application/javascript")
    js = (
        _SCRIPT.replace("%PID%", json.dumps(pid))
        .replace("%KEY%", json.dumps(k))
        .replace("%API%", json.dumps(API_BASE + "/campustrack-sync"))
    )
    return PlainTextResponse(js, media_type="application/javascript")
