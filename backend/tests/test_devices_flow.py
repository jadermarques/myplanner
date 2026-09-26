"""Tests for the login flow with TOTP on new devices."""
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


def _register(client: TestClient) -> None:
    """First access: set the password and register the device (password + TOTP)."""
    client.post(
        "/auth/set-password",
        json={"password": "senha123", "totp": pyotp.TOTP(SECRET).now()},
    )


def test_known_device_logs_in_without_totp(client: TestClient) -> None:
    _register(client)
    client.post("/auth/logout")
    resp = client.post("/auth/login", json={"password": "senha123"})
    assert resp.status_code == 200


def test_new_device_requires_totp(client: TestClient) -> None:
    _register(client)
    client.cookies.clear()  # brand-new device: no device cookie

    without = client.post("/auth/login", json={"password": "senha123"})
    assert without.status_code == 401

    code = pyotp.TOTP(SECRET).now()
    with_code = client.post("/auth/login", json={"password": "senha123", "totp": code})
    assert with_code.status_code == 200


def test_new_device_without_secret_errors(client: TestClient, monkeypatch) -> None:
    _register(client)
    monkeypatch.setattr(config.settings, "app_totp_secret", "")
    client.cookies.clear()
    resp = client.post("/auth/login", json={"password": "senha123"})
    assert resp.status_code == 400
    assert "TOTP" in resp.json()["detail"]


def test_set_password_requires_totp_on_new_device(client: TestClient) -> None:
    """Registering a device always demands password + TOTP (FR-001, S4)."""
    without = client.post("/auth/set-password", json={"password": "senha123"})
    assert without.status_code == 401

    code = pyotp.TOTP(SECRET).now()
    with_code = client.post(
        "/auth/set-password", json={"password": "senha123", "totp": code}
    )
    assert with_code.status_code == 200
    assert client.get("/version").status_code == 200


def test_set_password_without_secret_fails_controlled(client: TestClient, monkeypatch) -> None:
    """Spec edge case: no APP_TOTP_SECRET → controlled failure with a clear message."""
    monkeypatch.setattr(config.settings, "app_totp_secret", "")
    resp = client.post("/auth/set-password", json={"password": "senha123"})
    assert resp.status_code == 400
    assert "TOTP" in resp.json()["detail"]
