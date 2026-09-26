"""Password hashing (Argon2id) and strength validation (S2)."""
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

MIN_PASSWORD_LENGTH = 8

_hasher = PasswordHasher()


class WeakPasswordError(ValueError):
    """Raised when a password fails the strength requirement."""


def validate_password_strength(password: str) -> None:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise WeakPasswordError(f"a senha deve ter no mínimo {MIN_PASSWORD_LENGTH} caracteres")


def hash_password(password: str) -> str:
    validate_password_strength(password)
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False
    except Exception:  # noqa: BLE001 — nunca vazar erro de verificação
        return False
