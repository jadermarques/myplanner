"""Tests for the authentication use cases."""
from pathlib import Path

import pytest

from app.application.auth import (
    AuthError,
    change_password,
    is_password_set,
    login,
    set_password,
)
from app.infrastructure.password_store import PasswordStore


def _store(tmp_path: Path) -> PasswordStore:
    return PasswordStore(tmp_path / "password_hash")


def test_set_password_then_login(tmp_path: Path) -> None:
    store = _store(tmp_path)
    assert is_password_set(store) is False
    set_password(store, "senha123")
    assert is_password_set(store) is True
    assert login(store, "senha123") is True
    assert login(store, "errada") is False


def test_set_password_twice_rejected(tmp_path: Path) -> None:
    store = _store(tmp_path)
    set_password(store, "senha123")
    with pytest.raises(AuthError):
        set_password(store, "outra123")


def test_change_password(tmp_path: Path) -> None:
    store = _store(tmp_path)
    set_password(store, "senha123")
    change_password(store, "senha123", "nova1234")
    assert login(store, "nova1234") is True
    assert login(store, "senha123") is False


def test_change_password_wrong_current(tmp_path: Path) -> None:
    store = _store(tmp_path)
    set_password(store, "senha123")
    with pytest.raises(AuthError):
        change_password(store, "errada", "nova1234")
