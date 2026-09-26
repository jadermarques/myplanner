"""Tests for the version reader and GET /version (contracts/api.md)."""
from pathlib import Path

from fastapi.testclient import TestClient

from app import config
from app.main import app
from app.version import read_version

client = TestClient(app)


def test_read_version_returns_trimmed_content(tmp_path: Path) -> None:
    version_file = tmp_path / "VERSION"
    version_file.write_text("0.1.0\n", encoding="utf-8")
    assert read_version(version_file) == "0.1.0"


def test_read_version_unknown_when_missing(tmp_path: Path) -> None:
    assert read_version(tmp_path / "missing") == "unknown"


def test_version_endpoint_matches_file(monkeypatch, tmp_path: Path) -> None:
    version_file = tmp_path / "VERSION"
    version_file.write_text("0.1.0\n", encoding="utf-8")
    monkeypatch.setattr(config.settings, "version_file", version_file)
    response = client.get("/version")
    assert response.status_code == 200
    assert response.json() == {"version": "0.1.0"}


def test_version_endpoint_unknown_when_missing(monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(config.settings, "version_file", tmp_path / "missing")
    response = client.get("/version")
    assert response.status_code == 200
    assert response.json() == {"version": "unknown"}
