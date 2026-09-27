"""Shared pytest fixtures."""
import pytest

from app.config import settings
from app.main import app


@pytest.fixture(autouse=True)
def _clear_dependency_overrides():
    """Ensure FastAPI dependency overrides set in one test don't leak to others."""
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _isolate_state(tmp_path, monkeypatch):
    """Keep the password state isolated per test (never touch the real .data)."""
    monkeypatch.setattr(settings, "password_file", tmp_path / "password_hash")
    yield

