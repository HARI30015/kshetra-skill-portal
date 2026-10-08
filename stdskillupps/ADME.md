# stdskillupps

A student placement-preparation platform: lecturers publish real campus placements,
students link their LeetCode (and campus-track) profiles, and the platform generates
**year-aware study plans** from placement language/skill demand.

## Architecture

```
frontend/                 # (built by a separate agent) glassmorphism mobile-first UI
backend/                  # FastAPI REST API
  main.py                 # app factory, CORS, router wiring, GET /health
  deps.py                 # Supabase service client, JWT auth, role guards
  routers/                # profiles, stats, recommendations, placements
  services/leetcode.py    # public LeetCode GraphQL stats fetcher
  services/recommender.py # deterministic year-based plan generator (no LLM)
supabase/
  schema.sql              # tables + RLS + helper function
  seed.sql                # 15 realistic placement rows
postman/
  stdskillupps.postman_collection.json  # v2.1 collection for all endpoints
```

- **Auth**: Supabase Auth JWTs. The frontend signs users in via Supabase; the API
  validates `Authorization: Bearer <jwt>` with the anon client and enforces
  student/lecturer roles from the `profiles` table.
- **DB access**: backend uses the **service-role** key (RLS bypass) but enforces
  the same rules in code (`self_or_lecturer`, `require_lecturer`). Direct client
  access is additionally locked down by Row Level Security in `schema.sql`.

## Setup

### 1. Supabase
1. Create a project at https://supabase.com (note the project URL, anon key,
   service-role key).
2. SQL Editor → run `supabase/schema.sql`.
3. SQL Editor → run `supabase/seed.sql`.
4. Enable Email (or any) auth provider for sign-up/sign-in.

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
uvicorn main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### 3. Frontend
```bash
# from the frontend directory
npm run dev
```

## Environment variables

| Var | Where | Description |
|-----|-------|-------------|
| `SUPABASE_URL` | backend `.env` | Supabase project URL |
| `SUPABASE_ANON_KEY` | backend `.env` | Anon key (JWT validation) |
| `SUPABASE_SERVICE_KEY` | backend `.env` | Service-role key (DB access) |
| `FRONTEND_URL` | backend `.env` (optional) | Restrict CORS in production |

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/profiles` | JWT | Create profile row for signed-up user |
| GET | `/profiles/me` | JWT | Own profile |
| GET | `/profiles` | Lecturer | All profiles |
| PUT | `/profiles/{id}` | Self / lecturer | Update profile fields |
| POST | `/stats/sync/{profile_id}` | Self / lecturer | Fetch LeetCode stats, upsert |
| GET | `/stats/{profile_id}` | Self / lecturer | LeetCode stats row |
| POST | `/recommendations/generate/{profile_id}` | Self / lecturer | Generate year-based plan |
| GET | `/recommendations/{profile_id}` | Self / lecturer | Latest plan |
| GET | `/placements` | JWT | List placements (`?q=`, `?field=`) |
| POST | `/placements` | Lecturer | Add placement |
| PUT | `/placements/{id}` | Lecturer | Update placement |
| DELETE | `/placements/{id}` | Lecturer | Delete placement |

## Year-based recommendation logic

- **Year 1** – fundamentals: core languages per target field, basics, relaxed weekly routine.
- **Year 2** – compare LeetCode difficulty/language stats + CampusTrack score against
  placement demand; per-job language groups ("For PhonePe Backend Developer: Go, SQL…").
- **Year 3** – accelerated training: weekly targets, medium/hard focus, mocks.
- **Year 4** – intensive sprint: daily targets, interview revision, company-specific prep.

Deterministic (no LLM), built from the placements table so it adapts as lecturers add data.

## Campus-track integration

CampusTrack is currently a **free-text field** (`profiles.campustrack_username`,
`profiles.campustrack_score`) — the student enters/updates their username and score
manually. A live CampusTrack API/scraper can replace this later by swapping the fetch
in `services/` and the update path in `routers/profiles.py`.

## Field-name contract

DB columns (see `supabase/schema.sql`) and the frontend's field names differ in a few
places. The API speaks **both** directions:

| DB column | Frontend key | Used for |
|-----------|--------------|----------|
| `year` | `year_of_study` | year of study (1–4) |
| `target_field` | `target_job_field` | target job field |
| `campustrack_username` | `campus_track_username` | campus-track handle |
| `campustrack_score` | `campus_track_score` | campus-track score |
| `leetcode_total_solved` | `total_solved` | stats |
| `leetcode_easy` | `easy_solved` | stats |
| `leetcode_medium` | `medium_solved` | stats |
| `leetcode_hard` | `hard_solved` | stats |
| `updated_at` (student_stats) | `synced_at` | stats |
| `plan` (recommendations) | `plan_text` | recommendation |

- `PUT /profiles/{id}` accepts either name for each field (plus `onboarded`).
- Profile, stats, and recommendation responses include **both** the canonical column
  name and the frontend alias.
- `GET /profiles/me` returns **404** when the user has no profile row yet (the
  frontend treats this as "new user → run onboarding → POST /profiles").

Additive columns beyond the original contract (driven by the frontend's needs):
`profiles.onboarded` (boolean), `placements.package_lpa` (numeric),
`placements.location` (text), `placements.drive_date` (date). All nullable.

## External platforms

- **LeetCode** — https://leetcode.com/ (stored as a constant in `frontend/src/constants.js`). Stats are fetched from the public LeetCode GraphQL endpoint and **cached** in `student_stats`; the "Sync stats" button refetches on demand — the dashboard never refetches on page load.
- **CampusTrack** — https://www.campustrack.in/ (same constants file). No public API exists, so the campus-track score is a **self-reported field** the student enters manually, shown with a "verify later" note for lecturers. The UI offers "open in new tab" buttons so students can sign in on those sites, then come back and enter their username.

## Performance

- Frontend routes are code-split with `React.lazy` + `Suspense` — each page is its own chunk.
- Backend endpoints are lightweight: LeetCode stats are cached in the DB; recommendation generation is a deterministic in-process computation (no LLM calls).

## Deploy wiring (per service)

| Service | Config | Notes |
|---------|--------|-------|
| Vercel (frontend) | `vercel.json` (repo root) | Builds `frontend/` with Vite, SPA rewrite to `/index.html`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` in Vercel env. |
| Render (backend) | `render.yaml` (repo root) | Blueprint for a free Python web service: `uvicorn backend.main:app`, health check `/health`. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `FRONTEND_URL` in the Render dashboard. |
| Supabase | `supabase/schema.sql`, `supabase/seed.sql` | Run in the Supabase SQL editor (schema first, then seed). |
| Replit | `.replit` + `start.sh` (repo root) | Runs backend on :8000 and Vite dev server on `$PORT`. Put Supabase keys in Replit Secrets. |
| Postman | `postman/stdskillupps.postman_collection.json` | Import into Postman; set `{{base_url}}` and `{{jwt}}`. |

To keep everything in sync when the code changes: push to GitHub (repo `HARI30015/stdskillupps`), then redeploy the frontend on Vercel and the backend on Render (both can auto-deploy from the repo), re-run any new SQL from `supabase/` in the Supabase dashboard, and re-import the Postman collection.
