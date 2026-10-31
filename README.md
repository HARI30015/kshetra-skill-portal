# stdskillupps

A personalised placement preparation platform for students.
Live site: https://stdskillupps.vercel.app

Students link their LeetCode and CampusTrack profiles, get year-based
learning guidance (2nd year: language recommendations from profile
comparison; 3rd year: faster training; 4th year: intensive), and track
placement readiness. Lecturers can view all student profiles and statuses.

## What lives in this repo

- `stdskillupps/frontend/` — React + Vite app, deployed on Vercel.
- `stdskillupps/backend/` — FastAPI API, deployed on Render
  (https://stdskillupps-api.onrender.com).
- `stdskillupps/supabase/` — database schema.
- `stdskillupps/postman/` — API collection.

See `.env.example` for the environment variables each part needs
(never commit real keys).

## Note

The original SIH "Kshetra" app tree (top-level `frontend/`, `backend/`,
`static/`, `kshetra/`) was removed from `main` on 2026-10-31 as part of a
cleanup — it is not part of the live site. Its full history stays in git
and can be restored from any commit before that date.
