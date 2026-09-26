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
        request.state.authenticated = bool(token and _sessions.is_valid(token))
        response = await call_next(request)
        if request.state.authenticated:
            # sliding renewal: 90 days from now, on every authenticated request
            response.set_cookie(
                SESSION_COOKIE,
                _sessions.create(),
                httponly=True,
                samesite="strict",
                max_age=SESSION_MAX_AGE_SECONDS,
            )
        return response


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

