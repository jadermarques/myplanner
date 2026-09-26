"""Typed application configuration.

Secrets live in ``.env`` (never committed); non-secret params would live in
``config/app.yaml``. For this feature only the VERSION file path is required.
"""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root is two levels above this file: <repo>/backend/app/config.py
REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    version_file: Path = REPO_ROOT / "VERSION"


settings = Settings()
