"""Authentication use cases."""
from app.config import settings
from app.domain.password import hash_password, verify_password
from app.infrastructure.password_store import PasswordStore


class AuthError(Exception):
    """Raised when an authentication operation is not allowed."""


def get_password_store() -> PasswordStore:
    return PasswordStore(settings.password_file)


def _current_hash(store: PasswordStore) -> str | None:
    return store.get_hash() or (settings.app_password_hash or None)


def is_password_set(store: PasswordStore) -> bool:
    return _current_hash(store) is not None


def set_password(store: PasswordStore, password: str) -> None:
    if is_password_set(store):
        raise AuthError("senha já definida")
    store.set_hash(hash_password(password))


def login(store: PasswordStore, password: str) -> bool:
    current = _current_hash(store)
    if not current:
        raise AuthError("senha não definida")
    return verify_password(current, password)


def change_password(store: PasswordStore, current_password: str, new_password: str) -> None:
    current = _current_hash(store)
    if not current or not verify_password(current, current_password):
        raise AuthError("senha atual incorreta")
    store.set_hash(hash_password(new_password))
