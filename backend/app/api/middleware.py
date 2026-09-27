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
    new_csrf_token,
)

_sessions = SessionManager(settings.session_secret)
_CSRF_HEADER = "x-csrf-token"
_MUTATING = {"POST", "PUT", "PATCH", "DELETE"}


class SessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        token = request.cookies.get(SESSION_COOKIE)
        request.state.authenticated = bool(token and _sessions.is_valid(token))
        response = await call_next(request)
        if request.state.authenticated and not getattr(request.state, "session_ended", False):
            _renew_cookies(request, response)
        return response


def _renew_cookies(request: Request, response: Response) -> None:
    """Slide the session (and CSRF) window on every authenticated request.

    The session is re-signed with the same payload and the CSRF cookie is re-sent
    with the value the client already holds (a fresh one when it went missing), so
    cookie and header can never drift apart — the CSRF cookie used to never be
    renewed, which left the app unable to write (bug `csrf-after-logout`).

    Must NOT run for a request that just ended the session (logout), otherwise the
    renewal resurrects the cookie that the route deleted.
    """
    response.set_cookie(
        SESSION_COOKIE,
        _sessions.create(),
        httponly=True,
        samesite="strict",
        secure=settings.cookie_secure,
        max_age=SESSION_MAX_AGE_SECONDS,
    )
    response.set_cookie(
        CSRF_COOKIE,
        request.cookies.get(CSRF_COOKIE) or new_csrf_token(),
        httponly=False,
        samesite="strict",
        secure=settings.cookie_secure,
        max_age=SESSION_MAX_AGE_SECONDS,
    )


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

