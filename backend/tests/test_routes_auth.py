"""Integration tests for the auth routes."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.infrastructure.password_store import PasswordStore
from app.main import app


@pytest.fixture
def store(tmp_path: Path) -> PasswordStore:
    return PasswordStore(tmp_path / "password_hash")


@pytest.fixture
def client(store: PasswordStore, monkeypatch) -> TestClient:
    monkeypatch.setattr("app.api.routes_auth.get_password_store", lambda: store)
    return TestClient(app)


def test_status_reports_password_not_set(client: TestClient) -> None:
    resp = client.get("/auth/status")
    assert resp.status_code == 200
    assert resp.json() == {"password_set": False, "authenticated": False, "device_registered": False}


def test_set_password_then_login(client: TestClient) -> None:
    resp = client.post("/auth/set-password", json={"password": "senha123"})
    assert resp.status_code == 200
    assert "session" in resp.cookies

    client.post("/auth/logout")
    resp = client.post("/auth/login", json={"password": "senha123"})
    assert resp.status_code == 200


def test_login_wrong_password(client: TestClient) -> None:
    client.post("/auth/set-password", json={"password": "senha123"})
    client.post("/auth/logout")
    resp = client.post("/auth/login", json={"password": "errada"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Senha incorreta."


def test_set_password_rejects_weak(client: TestClient) -> None:
    resp = client.post("/auth/set-password", json={"password": "curta"})
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
