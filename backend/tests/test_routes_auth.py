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


def _define_password(client: TestClient, password: str = "senha123") -> None:
    client.post("/auth/set-password", json={"password": password})


def test_status_reports_password_not_set(client: TestClient) -> None:
    resp = client.get("/auth/status")
    assert resp.status_code == 200
    assert resp.json() == {"password_set": False, "authenticated": False}


def test_set_password_then_login(client: TestClient) -> None:
    resp = client.post("/auth/set-password", json={"password": "senha123"})
    assert resp.status_code == 200
    assert "session" in resp.cookies

    client.post("/auth/logout")
    resp = client.post("/auth/login", json={"password": "senha123"})
    assert resp.status_code == 200


def test_login_from_unseen_device_needs_only_the_password(client: TestClient) -> None:
    """FR-001/SC-001: a device never seen before enters with the password alone."""
    _define_password(client)
    client.cookies.clear()
    resp = client.post("/auth/login", json={"password": "senha123"})
    assert resp.status_code == 200


def test_login_wrong_password(client: TestClient) -> None:
    _define_password(client)
    client.post("/auth/logout")
    resp = client.post("/auth/login", json={"password": "errada"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Senha incorreta."


def test_repeated_wrong_password_is_never_blocked(client: TestClient) -> None:
    """FR-004: there is no lockout — every attempt is evaluated independently."""
    _define_password(client)
    client.post("/auth/logout")
    for _ in range(10):
        resp = client.post("/auth/login", json={"password": "errada"})
        assert resp.status_code == 401
    assert client.post("/auth/login", json={"password": "senha123"}).status_code == 200


def test_legacy_device_cookie_does_not_influence_access(client: TestClient) -> None:
    """FR-010: a leftover device cookie neither grants nor denies access."""
    client.cookies.set("device_id", "aparelho-antigo")
    assert client.post("/auth/login", json={"password": "senha123"}).status_code == 400

    _define_password(client)
    client.cookies.set("device_id", "aparelho-antigo")
    client.post("/auth/logout")
    resp = client.post("/auth/login", json={"password": "senha123"})
    assert resp.status_code == 200


def test_session_is_renewed_on_each_use(client: TestClient) -> None:
    """FR-005: an authenticated request renews the session for another 90 days."""
    _define_password(client)
    resp = client.get("/version")
    assert resp.status_code == 200
    assert "Max-Age=7776000" in resp.headers["set-cookie"]


def test_devices_routes_are_gone() -> None:
    """FR-003: the device endpoints and the device list no longer exist."""
    fresh = TestClient(app)
    assert fresh.get("/devices").status_code == 404
    assert fresh.post("/devices/x/revoke").status_code == 404


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

