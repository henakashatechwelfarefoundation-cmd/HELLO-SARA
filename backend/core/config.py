"""Application configuration loaded from environment variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


class Settings:
    MONGO_URL: str = os.environ["MONGO_URL"]
    DB_NAME: str = os.environ["DB_NAME"]
    JWT_SECRET: str = os.environ["JWT_SECRET"]
    JWT_EXPIRES_DAYS: int = int(os.environ.get("JWT_EXPIRES_DAYS", "30"))
    JWT_ALGORITHM: str = "HS256"
    EMERGENT_SESSION_API: str = os.environ.get(
        "EMERGENT_SESSION_API",
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
    )


settings = Settings()
