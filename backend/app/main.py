from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.routers import profile
from app.routers import resume          # ← NEW
from app.tasks.cron import start_scheduler, shutdown_scheduler

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title="JobFeed API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(resume.router,  prefix="/profile", tags=["resume"])
# resume router registers POST /profile/resume


@app.get("/health")
def health():
    return {"status": "ok"}
