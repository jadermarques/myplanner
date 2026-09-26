"""MyPlanner backend — FastAPI app exposing health, version, boards and cards.

Only `GET /health` is public; everything else requires a session (S1).
"""
from fastapi import Depends, FastAPI

from app.api.dependencies import require_auth
from app.api.middleware import CsrfMiddleware, SecurityHeadersMiddleware, SessionMiddleware
from app.api.routes import router
from app.api.routes_auth import router as auth_router
from app.api.routes_devices import router as devices_router
from app.config import settings
from app.version import read_version

app = FastAPI(title="MyPlanner")
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CsrfMiddleware)
app.add_middleware(SessionMiddleware)
app.include_router(auth_router)
app.include_router(devices_router)
app.include_router(router)


@app.get("/health")
def health() -> dict[str, str]:
    """Public liveness check."""
    return {"status": "ok"}


@app.get("/version", dependencies=[Depends(require_auth)])
def version() -> dict[str, str]:
    """Current app version (single source: VERSION file)."""
    return {"version": read_version(settings.version_file)}


