"""SQLAlchemy ORM models for the SENTINEL database."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Numeric,
    DateTime,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    full_name = Column(Text)
    role = Column(String, nullable=False, default="citizen")
    phone = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)
    incident_type = Column(String)
    location_name = Column(Text, nullable=False, default="Unknown")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geom = Column(Geography(geometry_type="POINT", srid=4326))
    severity = Column(String, nullable=False, default="Medium")
    description = Column(Text)
    status = Column(String, nullable=False, default="Reported")
    source = Column(String, nullable=False, default="CITIZEN")
    confidence = Column(Numeric, default=0.0)
    dispatched_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"))
    incident_type = Column(String, nullable=False)
    description = Column(Text)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(
        UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False
    )
    file_url = Column(Text, nullable=False)
    file_type = Column(String, nullable=False, default="photo")
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    message = Column(Text, nullable=False)
    level = Column(String, nullable=False, default="warning")
    source = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
