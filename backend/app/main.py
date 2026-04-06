from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.routers import profile
from app.routers import resume
from app.tasks.cron import start_scheduler, shutdown_scheduler
from app.database import close_async_client, health_check

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    # CHANGED: properly close async client on shutdown
    await close_async_client()
    shutdown_scheduler()


app = FastAPI(
    title="JobFeed API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url, "https://jod-feed-ai-powered-daily-job-diges.vercel.app",
        "https://jobdigest.site",
        "https://www.jobdigest.site",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(resume.router,  prefix="/profile", tags=["resume"])
# resume router registers POST /profile/resume


@app.get("/health")
async def health():
    """Health endpoint — checks Supabase connectivity."""
    db_ok = health_check()
    return {"status": "ok" if db_ok else "degraded", "database": "connected" if db_ok else "unreachable"}


@app.get("/")
def root():
    return {"status": "ok"}
