from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.resume import router as resume_router
from app.routes.dashboard import router as dashboard_router
from app.routes.resume_data import router as resume_data_router
from app.routes.skills import router as skills_router
from app.routes.career import router as career_router

app = FastAPI(
    title="CareerLens AI API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
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


@app.get("/")
def home():
    return {
        "status": "success",
        "message": "CareerLens AI Backend Running 🚀"
    }