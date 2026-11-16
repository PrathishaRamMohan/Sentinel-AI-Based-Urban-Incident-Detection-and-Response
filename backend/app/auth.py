"""Authentication utilities: password hashing and JWT tokens."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate a Supabase access token and return the linked local user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_exception
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id_str = payload.get("sub")
        email = payload.get("email")
        if user_id_str is None or email is None:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    return _get_or_create_local_user(db, user_id, email, payload)


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Validate an optional Supabase token and return its linked local user."""
    if token is None:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id_str = payload.get("sub")
        email = payload.get("email")
        if user_id_str is None or email is None:
            return None
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        return None
    return _get_or_create_local_user(db, user_id, email, payload)


def _get_or_create_local_user(db: Session, user_id: uuid.UUID, email: str, payload: dict) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user

    metadata = payload.get("user_metadata") or {}
    user = User(
        id=user_id,
        email=email,
        password_hash="supabase-auth",
        full_name=metadata.get("full_name"),
        phone=metadata.get("phone"),
        role="citizen",
    )
    db.add(user)
    db.flush()
    return user
