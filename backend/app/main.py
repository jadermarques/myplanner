"""MyPlanner backend — FastAPI app exposing health, version, boards and cards.

Health and version are public (temporary exception to S1, documented in the
spec Clarifications; S1 applies once login is in scope).
"""
from fastapi import FastAPI

from app.api.routes import router
from app.config import settings
from app.version import read_version

app = FastAPI(title="MyPlanner")
app.include_router(router)


@app.get("/health")
def health() -> dict[str, str]:
    """Public liveness check."""
    return {"status": "ok"}


@app.get("/version")
def version() -> dict[str, str]:
    """Current app version (single source: VERSION file)."""
    return {"version": read_version(settings.version_file)}

