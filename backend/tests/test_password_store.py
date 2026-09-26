"""Tests for the password state store."""
from pathlib import Path

from app.infrastructure.password_store import PasswordStore


def test_store_roundtrip(tmp_path: Path) -> None:
    store = PasswordStore(tmp_path / "sub" / "password_hash")
    assert store.get_hash() is None
    store.set_hash("hash123")
    assert store.get_hash() == "hash123"


def test_missing_file_returns_none(tmp_path: Path) -> None:
    assert PasswordStore(tmp_path / "missing").get_hash() is None
