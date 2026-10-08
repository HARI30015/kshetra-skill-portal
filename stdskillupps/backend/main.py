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

    # Dev convenience: allow all origins. RESTRICT in production via FRONTEND_URL.
    allowed_origins = os.getenv("FRONTEND_URL")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[allowed_origins] if allowed_origins else ["*"],
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
