"""Application configuration loaded from environment variables."""

import os
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env by default if present
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    DATABASE_URL: str
    SECRET_KEY: str
    JWT_ALGORITHM: str
    JWT_EXPIRE_MINUTES: int
    CORS_ORIGINS: list[str]
    UPLOAD_DIR: str
    MAX_UPLOAD_SIZE_MB: int
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_STORAGE_BUCKET: str

    def __init__(self) -> None:
        self.DATABASE_URL = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/sentinel",
        )
        self.SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
        self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        self.JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
        raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173")
        self.CORS_ORIGINS = [o.strip() for o in raw_cors.split(",") if o.strip()]
        self.UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(Path(__file__).resolve().parent.parent / "uploads"))
        self.MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "20"))
        self.SUPABASE_URL = os.getenv("SUPABASE_URL", "")
        self.SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", self.SECRET_KEY)
        self.SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "incident-evidence")


@lru_cache
def get_settings() -> Settings:
    return Settings()
