"""Session (signed cookie), CSRF and security headers."""
import secrets

from itsdangerous import BadSignature, URLSafeTimedSerializer

SESSION_COOKIE = "session"
CSRF_COOKIE = "csrf_token"
SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60  # 90 days


class SessionManager:
    def __init__(self, secret: str) -> None:
        self._serializer = URLSafeTimedSerializer(secret, salt="session")

    def create(self) -> str:
        return self._serializer.dumps({"authenticated": True})

    def read(self, token: str) -> dict | None:
        try:
            return self._serializer.loads(token, max_age=SESSION_MAX_AGE_SECONDS)
        except BadSignature:
            return None

    def is_valid(self, token: str) -> bool:
        data = self.read(token)
        return bool(data and data.get("authenticated"))


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
