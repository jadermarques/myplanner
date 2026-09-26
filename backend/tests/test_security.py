"""Tests for session, CSRF and progressive lockout."""
from app.infrastructure.security import (
    LockoutTracker,
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


def test_csrf_tokens_match() -> None:
    token = new_csrf_token()
    assert csrf_tokens_match(token, token) is True
    assert csrf_tokens_match(token, "other") is False
    assert csrf_tokens_match(None, token) is False
    assert csrf_tokens_match(token, None) is False


def test_lockout_progressive() -> None:
    tracker = LockoutTracker(threshold=5, base_seconds=30)
    for _ in range(4):
        tracker.record_failure()
    assert tracker.seconds_until_unlock() == 0.0
    tracker.record_failure()
    assert tracker.seconds_until_unlock() > 0
    tracker.record_success()
    assert tracker.seconds_until_unlock() == 0.0
