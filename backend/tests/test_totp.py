"""Tests for TOTP verification."""
import pyotp

from app.infrastructure.totp import verify_totp

SECRET = pyotp.random_base32()


def test_valid_code_accepted() -> None:
    assert verify_totp(SECRET, pyotp.TOTP(SECRET).now()) is True


def test_invalid_code_rejected() -> None:
    other = pyotp.TOTP(pyotp.random_base32()).now()
    assert verify_totp(SECRET, other) is False


def test_empty_inputs_rejected() -> None:
    assert verify_totp("", "123456") is False
    assert verify_totp(SECRET, "") is False
