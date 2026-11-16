"""Citizen report endpoints — submitting and retrieving reports."""

import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import CitizenReport, Incident, IncidentEvidence, User, Alert
from app.schemas import CitizenReportCreate, CitizenReportResponse, VALID_INCIDENT_TYPES
from app.auth import get_optional_user

router = APIRouter(prefix="/api/v1/citizen-reports", tags=["citizen-reports"])
settings = get_settings()


def _create_incident_from_report(
    db: Session,
    report: CitizenReportCreate,
    user: Optional[User],
) -> Incident:
    """Create an Incident row and Alert from a citizen report, storing geom via raw SQL."""
    incident = Incident(
        type=report.incident_type,
        incident_type=report.incident_type,
        location_name="Citizen Report",
        latitude=report.latitude,
        longitude=report.longitude,
        severity="High" if report.incident_type in ["Fire", "Road Accident"] else "Medium",
        description=report.description,
        status="Reported",
        source="CITIZEN",
        confidence=0.0,
    )
    db.add(incident)
    db.flush()  # get the ID without committing

    # Create associated system alert
    alert = Alert(
        title=f"New {report.incident_type} Reported",
        message=report.description or f"Citizen report logged at lat: {report.latitude:.4f}, lng: {report.longitude:.4f}",
        level="critical" if report.incident_type in ["Fire", "Road Accident"] else "warning",
        source="CITIZEN_REPORT",
    )
    db.add(alert)

    # Set the PostGIS geography point via raw SQL (GeoAlchemy2 integration)
    from sqlalchemy import text

    db.execute(
        text(
            "UPDATE incidents SET geom = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography "
            "WHERE id = :id"
        ),
        {"lng": report.longitude, "lat": report.latitude, "id": str(incident.id)},
    )

    return incident


@router.post("", response_model=CitizenReportResponse, status_code=status.HTTP_201_CREATED)
async def create_citizen_report(
    report: CitizenReportCreate,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
) -> CitizenReportResponse:
    """Submit a citizen incident report. Creates a corresponding Incident with status=DETECTED."""
    incident = _create_incident_from_report(db, report, user)

    citizen_report = CitizenReport(
        user_id=user.id if user else None,
        incident_id=incident.id,
        incident_type=report.incident_type,
        description=report.description,
        latitude=report.latitude,
        longitude=report.longitude,
    )
    db.add(citizen_report)
    db.commit()
    db.refresh(citizen_report)
    return citizen_report


@router.post("/with-evidence", response_model=CitizenReportResponse, status_code=status.HTTP_201_CREATED)
async def create_citizen_report_with_evidence(
    incident_type: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
) -> CitizenReportResponse:
    """Submit a citizen report with optional photo/video evidence uploads."""
    if incident_type not in VALID_INCIDENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid incident type. Must be one of: {', '.join(sorted(VALID_INCIDENT_TYPES))}",
        )
    if not -90 <= latitude <= 90:
        raise HTTPException(status_code=422, detail="Latitude must be between -90 and 90")
    if not -180 <= longitude <= 180:
        raise HTTPException(status_code=422, detail="Longitude must be between -180 and 180")

    report_data = CitizenReportCreate(
        incident_type=incident_type,
        latitude=latitude,
        longitude=longitude,
        description=description,
    )

    incident = _create_incident_from_report(db, report_data, user)

    citizen_report = CitizenReport(
        user_id=user.id if user else None,
        incident_id=incident.id,
        incident_type=incident_type,
        description=description,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(citizen_report)
    db.flush()

    if files and (not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY):
        raise HTTPException(status_code=503, detail="Supabase Storage is not configured")

    for f in files:
        original_name = f.filename or "evidence"
        ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
        ext = f".{ext}" if ext else ""
        if ext in (".jpg", ".jpeg", ".png", ".webp"):
            file_type = "photo"
        elif ext in (".mp4", ".mov", ".avi", ".webm"):
            file_type = "video"
        else:
            continue

        file_name = f"{uuid.uuid4().hex}{ext}"
        storage_path = f"{incident.id}/{file_name}"
        content = await f.read()
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File {f.filename} exceeds max size of {settings.MAX_UPLOAD_SIZE_MB}MB",
            )
        upload_url = (
            f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/"
            f"{settings.SUPABASE_STORAGE_BUCKET}/{storage_path}"
        )
        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": f.content_type or "application/octet-stream",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            upload_response = await client.post(upload_url, content=content, headers=headers)
        if upload_response.is_error:
            raise HTTPException(status_code=502, detail="Evidence upload to Supabase Storage failed")

        file_url = (
            f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/"
            f"{settings.SUPABASE_STORAGE_BUCKET}/{storage_path}"
        )
        evidence = IncidentEvidence(
            incident_id=incident.id,
            file_url=file_url,
            file_type=file_type,
            uploaded_by=user.id if user else None,
        )
        db.add(evidence)

    db.commit()
    db.refresh(citizen_report)
    return citizen_report


@router.get("/{report_id}", response_model=CitizenReportResponse)
async def get_citizen_report(report_id: uuid.UUID, db: Session = Depends(get_db)):
    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Citizen report not found")
    return report
