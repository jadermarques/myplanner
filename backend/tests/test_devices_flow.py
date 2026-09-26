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


def test_known_device_logs_in_without_totp(client: TestClient) -> None:
    client.post("/auth/set-password", json={"password": "senha123"})  # registers device
    client.post("/auth/logout")
    resp = client.post("/auth/login", json={"password": "senha123"})
    assert resp.status_code == 200


def test_new_device_requires_totp(client: TestClient) -> None:
    client.post("/auth/set-password", json={"password": "senha123"})
    client.cookies.clear()  # brand-new device: no device cookie

    without = client.post("/auth/login", json={"password": "senha123"})
    assert without.status_code == 401

    code = pyotp.TOTP(SECRET).now()
    with_code = client.post("/auth/login", json={"password": "senha123", "totp": code})
    assert with_code.status_code == 200


def test_new_device_without_secret_errors(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(config.settings, "app_totp_secret", "")
    client.post("/auth/set-password", json={"password": "senha123"})
    client.cookies.clear()
    resp = client.post("/auth/login", json={"password": "senha123"})
    assert resp.status_code == 400
