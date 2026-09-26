"""Session, CSRF and security-headers middleware."""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings
from app.infrastructure.security import (
    CSRF_COOKIE,
    SECURITY_HEADERS,
    SESSION_COOKIE,
    SESSION_MAX_AGE_SECONDS,
    SessionManager,
    csrf_tokens_match,
)

_sessions = SessionManager(settings.session_secret)
_CSRF_HEADER = "x-csrf-token"
_MUTATING = {"POST", "PUT", "PATCH", "DELETE"}


class SessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        token = request.cookies.get(SESSION_COOKIE)
        payload = _sessions.read(token) if token else None
        device_id = (payload or {}).get("device_id", "") or ""
        authenticated = bool(payload and payload.get("authenticated"))
        if authenticated and device_id and not _device_exists(device_id):
            authenticated = False  # device revoked (FR-006)
        request.state.authenticated = authenticated
        request.state.device_id = device_id
        response = await call_next(request)
        if authenticated:
            # sliding renewal: 90 days from now, on every authenticated request
            response.set_cookie(
                SESSION_COOKIE,
                _sessions.create(device_id),
                httponly=True,
                samesite="strict",
                max_age=SESSION_MAX_AGE_SECONDS,
            )
        return response


def _device_exists(device_id: str) -> bool:
    from app.application.devices import get_device_store

    return get_device_store().get(device_id) is not None


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        for key, value in SECURITY_HEADERS.items():
            response.headers[key] = value
        return response


class CsrfMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        is_mutation = request.method in _MUTATING
        is_authenticated = getattr(request.state, "authenticated", False)
        is_auth_path = request.url.path.startswith("/auth")
        if is_mutation and is_authenticated and not is_auth_path:
            if not csrf_tokens_match(
                request.cookies.get(CSRF_COOKIE),
                request.headers.get(_CSRF_HEADER),
            ):
                return Response(
                    content='{"detail":"CSRF inválido"}',
                    status_code=403,
                    media_type="application/json",
                )
        return await call_next(request)

