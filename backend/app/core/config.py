"""
Centralized application settings loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """All configuration for the Sentivoy backend, loaded from .env."""

    # ── App ──────────────────────────────────────────
    app_name: str = "Sentivoy"
    app_env: str = "development"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:8080"

    # ── Supabase ─────────────────────────────────────
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # ── Security ─────────────────────────────────────
    api_key: str = "sentivoy-dev-api-key-change-me"

    # ── ML ───────────────────────────────────────────
    anomaly_threshold: float = 0.05
    rate_limit: int = 60  # requests per minute

    # ── Email (Resend) ───────────────────────────────
    resend_api_key: str = ""
    resend_from_email: str = "onboarding@resend.dev"
    alert_email_enabled: bool = True

    model_config = {
        "env_file": os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Return a cached singleton of the app settings."""
    return Settings()
