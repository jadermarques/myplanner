"""Reads/writes the single-user password hash in a gitignored state file."""
from pathlib import Path


class PasswordStore:
    def __init__(self, path: Path) -> None:
        self._path = path

    def get_hash(self) -> str | None:
        try:
            content = self._path.read_text(encoding="utf-8").strip()
        except OSError:
            return None
        return content or None

    def set_hash(self, password_hash: str) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(password_hash + "\n", encoding="utf-8")
