"""Pydantic request/response schemas."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


# ─── Auth ───────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    role: str
    phone: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Citizen Report ─────────────────────────────────────────

VALID_INCIDENT_TYPES = {"Road Accident", "Possible Physical Altercation", "Medical Emergency", "Fire", "Other"}


class CitizenReportCreate(BaseModel):
    incident_type: str
    description: Optional[str] = None
    latitude: float
    longitude: float

    @field_validator("incident_type")
    @classmethod
    def validate_incident_type(cls, v: str) -> str:
        if v not in VALID_INCIDENT_TYPES:
            raise ValueError(f"Invalid incident type. Must be one of: {', '.join(sorted(VALID_INCIDENT_TYPES))}")
        return v

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not -90 <= v <= 90:
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not -180 <= v <= 180:
            raise ValueError("Longitude must be between -180 and 180")
        return v


class CitizenReportResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    incident_id: Optional[uuid.UUID] = None
    incident_type: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Incident ───────────────────────────────────────────────

class IncidentResponse(BaseModel):
    id: uuid.UUID
    type: str
    incident_type: Optional[str] = None
    location_name: str
    latitude: float
    longitude: float
    severity: str
    description: Optional[str] = None
    status: str
    source: str
    confidence: float
    dispatched_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IncidentListResponse(BaseModel):
    incidents: list[IncidentResponse]
    total: int


# ─── Evidence ───────────────────────────────────────────────

class EvidenceResponse(BaseModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    file_url: str
    file_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Health ─────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str
    database: str
