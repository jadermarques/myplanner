"""Tests for the device-bound session."""
from app.infrastructure.security import SessionManager


def test_session_carries_device_id() -> None:
    manager = SessionManager("secret")
    token = manager.create("device-1")
    data = manager.read(token)
    assert data is not None
    assert data["authenticated"] is True
    assert data["device_id"] == "device-1"
    assert manager.is_valid(token) is True


def test_session_read_rejects_tampered() -> None:
    manager = SessionManager("secret")
    token = manager.create("d")
    assert manager.read(token + "x") is None
    assert manager.read("garbage") is None
