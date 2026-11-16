"""FastAPI application entry point with AI CCTV Engine."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
# IMPORT: Added cctv alongside your other modules
from app.routers import auth, citizen_reports, incidents, cctv

settings = get_settings()

app = FastAPI(
    title="SENTINEL API",
    description="AI-Powered Multi-Source Urban Incident Detection & Emergency Response System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded evidence files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(citizen_reports.router)
app.include_router(incidents.router)
# MOUNT MODULE: Registered your new live AI CCTV analysis endpoint
app.include_router(cctv.router)


@app.get("/api/v1/health", tags=["health"])
async def health_check():
    """Check API and database connectivity."""
    from app.database import engine
    from sqlalchemy import text

    db_status = "ok"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "unavailable"

    return {"status": "ok" if db_status == "ok" else "degraded", "service": "sentinel-api", "database": db_status}


@app.get("/", tags=["health"])
async def root():
    return {"service": "SENTINEL API", "version": "1.0.0", "docs": "/docs"}
