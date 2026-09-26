"""Shared pytest fixtures."""
import pytest

from app.main import app


@pytest.fixture(autouse=True)
def _clear_dependency_overrides():
    """Ensure FastAPI dependency overrides set in one test don't leak to others."""
    yield
    app.dependency_overrides.clear()
