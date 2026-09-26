"""Integration tests for the auth routes."""
from pathlib import Path

import pyotp
import pytest
from fastapi.testclient import TestClient

from app.infrastructure.password_store import PasswordStore
from app.main import app

SECRET = pyotp.random_base32()


@pytest.fixture
def store(tmp_path: Path) -> PasswordStore:
    return PasswordStore(tmp_path / "password_hash")


@pytest.fixture
def client(store: PasswordStore, monkeypatch) -> TestClient:
    monkeypatch.setattr("app.api.routes_auth.get_password_store", lambda: store)
    monkeypatch.setattr("app.config.settings.app_totp_secret", SECRET)
    return TestClient(app)


def _register(client: TestClient, password: str = "senha123") -> None:
    """First access now demands password + TOTP (FR-001/S4, feature 004)."""
    client.post(
        "/auth/set-password",
        json={"password": password, "totp": pyotp.TOTP(SECRET).now()},
    )


def test_status_reports_password_not_set(client: TestClient) -> None:
    resp = client.get("/auth/status")
    assert resp.status_code == 200
    assert resp.json() == {"password_set": False, "authenticated": False, "device_registered": False}


def test_set_password_then_login(client: TestClient) -> None:
    _register(client)
    assert "session" in client.cookies

    client.post("/auth/logout")
    resp = client.post("/auth/login", json={"password": "senha123"})
    assert resp.status_code == 200


def test_login_wrong_password(client: TestClient) -> None:
    _register(client)
    client.post("/auth/logout")
    resp = client.post("/auth/login", json={"password": "errada"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Senha incorreta."


def test_set_password_rejects_weak(client: TestClient) -> None:
    # a valid TOTP is sent so the weak-password rule is what rejects the request
    resp = client.post(
        "/auth/set-password",
        json={"password": "curta", "totp": pyotp.TOTP(SECRET).now()},
    )
    assert resp.status_code == 400


def test_protected_endpoint_requires_session() -> None:
    fresh = TestClient(app)
    assert fresh.get("/version").status_code == 401
    assert fresh.get("/boards").status_code == 401
    assert fresh.get("/health").status_code == 200


def test_change_password_requires_session() -> None:
    fresh = TestClient(app)
    resp = fresh.post(
        "/auth/change-password",
        json={"current_password": "x", "new_password": "yyyyyyyy"},
    )
    assert resp.status_code == 401
