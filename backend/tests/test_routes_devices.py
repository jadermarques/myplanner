"""Tests for the device management routes."""
import time

import pyotp
import pytest
from fastapi.testclient import TestClient

from app import config
from app.main import app

SECRET = pyotp.random_base32()


@pytest.fixture
def client(monkeypatch) -> TestClient:
    monkeypatch.setattr(config.settings, "app_totp_secret", SECRET)
    return TestClient(app)


def _auth(client: TestClient) -> None:
    """Set the password and register the device (password + TOTP)."""
    client.post(
        "/auth/set-password",
        json={"password": "senha123", "totp": pyotp.TOTP(SECRET).now()},
    )


def test_list_devices(client: TestClient) -> None:
    _auth(client)
    resp = client.get("/devices")
    assert resp.status_code == 200
    devices = resp.json()
    assert len(devices) == 1
    assert "name" in devices[0]
    assert "id" in devices[0]


def test_revoke_device_invalidates_session(client: TestClient) -> None:
    _auth(client)
    device_id = client.get("/devices").json()[0]["id"]
    csrf = client.cookies.get("csrf_token")
    resp = client.post(f"/devices/{device_id}/revoke", headers={"X-CSRF-Token": csrf})
    assert resp.status_code == 200
    assert client.get("/version").status_code == 401


def test_revoke_unknown_device_404(client: TestClient) -> None:
    _auth(client)
    csrf = client.cookies.get("csrf_token")
    resp = client.post("/devices/nope/revoke", headers={"X-CSRF-Token": csrf})
    assert resp.status_code == 404


def test_devices_require_session() -> None:
    fresh = TestClient(app)
    assert fresh.get("/devices").status_code == 401


def test_last_used_at_is_updated_on_use(client: TestClient) -> None:
    """FR-004 / US2-AC1: the device list carries the last use."""
    _auth(client)
    first = client.get("/devices").json()[0]["last_used_at"]

    time.sleep(0.01)
    assert client.get("/version").status_code == 200

    second = client.get("/devices").json()[0]["last_used_at"]
    assert second > first
