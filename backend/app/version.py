"""Version reader — the VERSION file is the single source of truth (O4)."""
from pathlib import Path


def read_version(path: Path) -> str:
    """Return the trimmed VERSION content, or "unknown" on failure.

    Controlled fallback per spec edge case: a missing/unreadable/empty file
    must never crash the app.
    """
    try:
        content = path.read_text(encoding="utf-8").strip()
    except OSError:
        return "unknown"
    return content or "unknown"
