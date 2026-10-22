"""stdskillupps backend — FastAPI app factory."""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import placements, profiles, recommendations, stats  # noqa: E402


def create_app() -> FastAPI:
    app = FastAPI(
        title="stdskillupps API",
        description="Student placement-preparation platform API",
        version="0.1.0",
    )

    # CORS: the production site must ALWAYS be allowed, no matter what
    # FRONTEND_URL happens to hold in the host's dashboard. A stale or
    # mistyped FRONTEND_URL there once made Starlette answer every
    # browser preflight with 400 "Disallowed CORS origin", which broke
    # ALL backend calls from the real website (profile loads, sign-up
    # checks) while curl tests kept passing — CORS is browser-only.
    origins = {
        "https://stdskillupps.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    }
    env_frontend = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    if env_frontend:
        origins.add(env_frontend)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=sorted(origins),
        # Vercel preview deployments for this project.
        allow_origin_regex=r"https://stdskillupps[a-z0-9-]*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(profiles.router)
    app.include_router(stats.router)
    app.include_router(recommendations.router)
    app.include_router(placements.router)

    @app.get("/health", tags=["health"])
    def health():
        return {"status": "ok", "service": "stdskillupps"}

    return app


app = create_app()
