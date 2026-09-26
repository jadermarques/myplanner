"""MyPlanner backend — FastAPI app exposing health and version.

Both endpoints are public in this feature (temporary exception to S1,
documented in the spec Clarifications; S1 applies once login is in scope).
"""
from fastapi import FastAPI

from app.config import settings
from app.version import read_version

app = FastAPI(title="MyPlanner")


@app.get("/health")
def health() -> dict[str, str]:
    """Public liveness check."""
    return {"status": "ok"}


@app.get("/version")
def version() -> dict[str, str]:
    """Current app version (single source: VERSION file)."""
    return {"version": read_version(settings.version_file)}
