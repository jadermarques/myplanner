"""Tests for session and CSRF helpers."""
import time

from itsdangerous import URLSafeTimedSerializer

from app.infrastructure.security import (
    SESSION_MAX_AGE_SECONDS,
    SessionManager,
    csrf_tokens_match,
    new_csrf_token,
)


def test_session_roundtrip_and_tamper() -> None:
    manager = SessionManager("secret")
    token = manager.create()
    assert manager.is_valid(token) is True
    assert manager.is_valid(token + "x") is False
    assert manager.is_valid("garbage") is False


def test_session_rejects_other_secret() -> None:
    token = SessionManager("secret-a").create()
    assert SessionManager("secret-b").is_valid(token) is False


def test_session_from_previous_version_stays_valid() -> None:
    """FR-007: a session created before the change (payload with device_id) still works."""
    legacy = URLSafeTimedSerializer("secret", salt="session").dumps(
        {"authenticated": True, "device_id": "aparelho-antigo"}
    )
    assert SessionManager("secret").is_valid(legacy) is True


def test_session_older_than_90_days_expires() -> None:
    """FR-005: the session window is 90 days, enforced by the signature timestamp."""
    assert SESSION_MAX_AGE_SECONDS == 90 * 24 * 60 * 60

    serializer = URLSafeTimedSerializer("secret", salt="session")
    payload = serializer.dump_payload({"authenticated": True})
    signer = serializer.make_signer(salt="session")
    signer.get_timestamp = lambda: int(time.time()) - 91 * 24 * 60 * 60  # type: ignore[method-assign]
    old_session = signer.sign(payload).decode()

    assert SessionManager("secret").is_valid(old_session) is False


def test_csrf_tokens_match() -> None:
    token = new_csrf_token()
    assert csrf_tokens_match(token, token) is True
    assert csrf_tokens_match(token, "other") is False
    assert csrf_tokens_match(None, token) is False
    assert csrf_tokens_match(token, None) is False

