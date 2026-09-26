"""Typed application configuration.

Secrets live in ``.env`` (never committed). Trello creds (secret) come from
``.env``. Priority labels and rate limit are defaults that mirror
``config/app.yaml`` (kept in sync; wiring YAML loading is a later refinement).
"""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root is two levels above this file: <repo>/backend/app/config.py
REPO_ROOT = Path(__file__).resolve().parents[2]


class RateLimit(BaseSettings):
    requests_per_10s: int = 40
    backoff: str = "exponential"


class TrelloSettings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    priority_labels: list[str] = ["Muito alta", "Alta", "Média", "Baixa", "Muito baixa"]
    rate_limit: RateLimit = RateLimit()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        extra="ignore",
    )

    version_file: Path = REPO_ROOT / "VERSION"
    trello_api_key: str = ""
    trello_token: str = ""
    trello: TrelloSettings = TrelloSettings()


settings = Settings()

