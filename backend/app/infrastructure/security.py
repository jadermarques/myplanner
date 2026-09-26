"""Session (signed cookie), CSRF, progressive lockout and security headers."""
import secrets
import time

from itsdangerous import BadSignature, URLSafeTimedSerializer

SESSION_COOKIE = "session"
CSRF_COOKIE = "csrf_token"
SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60  # 90 days
LOCKOUT_THRESHOLD = 5
LOCKOUT_BASE_SECONDS = 30


class SessionManager:
    def __init__(self, secret: str) -> None:
        self._serializer = URLSafeTimedSerializer(secret, salt="session")

    def create(self) -> str:
        return self._serializer.dumps({"authenticated": True})

    def is_valid(self, token: str) -> bool:
        try:
            data = self._serializer.loads(token, max_age=SESSION_MAX_AGE_SECONDS)
        except BadSignature:
            return False
        return bool(data.get("authenticated"))


class LockoutTracker:
    """Progressive lockout: 5 failures → 30 s, doubling each extra failure (S5)."""

    def __init__(self, threshold: int = LOCKOUT_THRESHOLD, base_seconds: float = LOCKOUT_BASE_SECONDS) -> None:
        self._threshold = threshold
        self._base = base_seconds
        self._failed = 0
        self._locked_until = 0.0

    def seconds_until_unlock(self) -> float:
        return max(0.0, self._locked_until - time.monotonic())

    def record_failure(self) -> None:
        self._failed += 1
        if self._failed >= self._threshold:
            extra = self._failed - self._threshold
            self._locked_until = time.monotonic() + self._base * (2**extra)

    def record_success(self) -> None:
        self._failed = 0
        self._locked_until = 0.0


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def csrf_tokens_match(cookie_token: str | None, header_token: str | None) -> bool:
    if not cookie_token or not header_token:
        return False
    return secrets.compare_digest(cookie_token, header_token)


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'",
}
