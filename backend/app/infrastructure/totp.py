"""TOTP verification (pyotp) with a ±1 period window (S4)."""
import pyotp

VALID_WINDOW = 1


def verify_totp(secret: str, code: str) -> bool:
    if not secret or not code:
        return False
    try:
        return pyotp.TOTP(secret).verify(code.strip(), valid_window=VALID_WINDOW)
    except Exception:  # noqa: BLE001 — nunca vazar erro de verificação
        return False
