# stdskillupps — Frontend

Student placement-preparation platform. React 18 + Vite 5 + Tailwind CSS 3 + Framer Motion 11.
Dark glassmorphism UI, mobile-first, animated on every screen.

## Prerequisites

- Node.js 18+ and npm
- A Supabase project (Auth + your `stdskillupps` backend schema)
- The `stdskillupps` backend running (see its README for the API)

## Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | What it is |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_API_URL` | Base URL of the backend API (e.g. `http://localhost:8000`) |

## Run

```bash
npm run dev     # dev server at http://localhost:5173
npm run build   # production build → dist/
npm run preview # preview the production build
```

## Routes

| Route | Who | What |
| --- | --- | --- |
| `/` | Everyone | Animated landing page |
| `/login`, `/signup` | Guests | Glass auth cards |
| `/onboarding` | Students (first login) | 4-step animated setup: year → field → LeetCode → campus-track |
| `/dashboard` | Students | Profile, LeetCode stats sync, year timeline, AI guidance plan, resources |
| `/lecturer` | Lecturers | Students table with edit modal + placements CRUD |
| `/placements` | Students, Lecturers | Searchable/filterable placement drives |

## How auth works

1. Users sign up / sign in with **Supabase Auth** directly from this frontend (`supabaseClient.js`).
2. `AuthContext` loads the user's row via `GET /profiles/me` and exposes `role`, `needsOnboarding`, and `logout`.
3. `api.js` attaches the Supabase session JWT as `Authorization: Bearer …` on every backend call.
4. `ProtectedRoute` redirects guests to `/login`, students who haven't onboarded to `/onboarding`, and wrong-role users to their own home.

## Project structure

```
src/
  main.jsx            # React root, router, auth provider
  App.jsx             # Routes + AnimatePresence page transitions
  index.css           # Tailwind + fonts, scrollbar, glass/text-gradient/shimmer utilities
  supabaseClient.js   # Supabase client
  api.js              # Axios wrapper + every backend endpoint function
  context/AuthContext.jsx
  components/         # GlassCard, Navbar, Orbs, PageWrapper, ProtectedRoute,
                      # AnimatedInput, AnimatedButton, Loader
  pages/              # Landing, Login, Signup, Onboarding, Dashboard,
                      # LecturerDashboard, Placements
```

## Backend contract (matched by api.js)

- `GET /profiles/me` · `GET /profiles` (lecturer) · `PUT /profiles/{id}` · `POST /profiles`
- `POST /stats/sync/{profile_id}` → student_stats row · `GET /stats/{profile_id}`
- `POST /recommendations/generate/{profile_id}` → recommendation · `GET /recommendations/{profile_id}`
- `GET /placements?q=&field=` · `POST /placements` · `PUT /placements/{id}` · `DELETE /placements/{id}`
- `GET /health`
