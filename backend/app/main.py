import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.resume import router as resume_router
from app.routes.dashboard import router as dashboard_router
from app.routes.resume_data import router as resume_data_router
from app.routes.skills import router as skills_router
from app.routes.career import router as career_router
from app.routes.learning_path import router as learning_path_router
from app.routes.jobs import router as jobs_router
from app.routes.placement_drives import router as placement_drives_router
from app.routes.mock_interview import router as mock_interview_router
from app.routes.skill_assessment import router as skill_assessment_router
from app.routes.certificates import router as certificates_router
from app.routes.settings import router as settings_router
from app.routes.support import router as support_router
from app.routes.notifications import router as notifications_router

from app.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Starts the Placement Drives 24-hour sync job (see scheduler.py).
    # Runs once immediately on startup, then every 24 hours after that.
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="CareerLens AI API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
#
# Always allows the local Vite dev server plus the production Vercel
# frontend. Extra origins (a custom domain, a Vercel preview URL, etc.)
# can be added without a code change via the FRONTEND_ORIGINS env var
# on whatever host runs this backend - comma-separated, e.g.:
#   FRONTEND_ORIGINS=https://careerlens.example.com,https://career-lens-ai-git-preview.vercel.app
_default_origins = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://career-lens-ai-psi.vercel.app",
}
_extra_origins = {
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
}
allowed_origins = sorted(_default_origins | _extra_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(resume_router)
app.include_router(dashboard_router)
app.include_router(resume_data_router)
app.include_router(skills_router)
app.include_router(career_router)
app.include_router(learning_path_router)
app.include_router(jobs_router)
app.include_router(placement_drives_router)
app.include_router(mock_interview_router)
app.include_router(skill_assessment_router)
app.include_router(certificates_router)
app.include_router(settings_router)
app.include_router(support_router)
app.include_router(notifications_router)


@app.get("/")
def home():
    return {
        "status": "success",
        "message": "CareerLens AI Backend Running 🚀"
    }