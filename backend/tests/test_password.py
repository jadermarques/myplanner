"""Tests for password hashing and strength (Argon2id)."""
import pytest

from app.domain.password import WeakPasswordError, hash_password, verify_password


def test_hash_and_verify_roundtrip() -> None:
    hashed = hash_password("senha123")
    assert hashed != "senha123"
    assert verify_password(hashed, "senha123") is True


def test_verify_rejects_wrong_password() -> None:
    hashed = hash_password("senha123")
    assert verify_password(hashed, "errada") is False


def test_weak_password_rejected() -> None:
    with pytest.raises(WeakPasswordError):
        hash_password("curta")
