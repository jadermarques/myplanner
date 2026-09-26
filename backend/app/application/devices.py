"""Device use cases: register, list and revoke."""
import secrets
from datetime import datetime, timezone

from app.config import settings
from app.domain.device import Device, derive_device_name
from app.infrastructure.device_store import DeviceStore

DEVICE_COOKIE = "device_id"
DEVICE_COOKIE_MAX_AGE = 10 * 365 * 24 * 60 * 60  # 10 years


class DeviceError(Exception):
    """Raised when a device operation is not allowed."""


def get_device_store() -> DeviceStore:
    return DeviceStore(settings.device_file)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def register_device(
    store: DeviceStore,
    user_agent: str,
    device_id: str | None = None,
) -> Device:
    device = Device(
        id=device_id or secrets.token_urlsafe(16),
        name=derive_device_name(user_agent),
        created_at=now_iso(),
        last_used_at=now_iso(),
    )
    store.add(device)
    return device


def list_devices(store: DeviceStore) -> list[Device]:
    return store.list()


def revoke_device(store: DeviceStore, device_id: str) -> None:
    if not store.remove(device_id):
        raise DeviceError("aparelho não encontrado")
