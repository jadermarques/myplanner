"""Tests for the device store."""
from pathlib import Path

from app.domain.device import Device
from app.infrastructure.device_store import DeviceStore


def test_add_get_list_remove(tmp_path: Path) -> None:
    store = DeviceStore(tmp_path / "devices.json")
    assert store.list() == []

    device = Device(id="d1", name="Chrome no Android", created_at="c", last_used_at="c")
    store.add(device)
    assert store.get("d1") == device
    assert store.list() == [device]

    assert store.remove("d1") is True
    assert store.list() == []
    assert store.remove("d1") is False


def test_touch_updates_last_used(tmp_path: Path) -> None:
    store = DeviceStore(tmp_path / "devices.json")
    store.add(Device(id="d1", name="X", created_at="c", last_used_at="c"))
    store.touch("d1", "later")
    assert store.get("d1").last_used_at == "later"


def test_derive_device_name() -> None:
    from app.domain.device import derive_device_name

    assert derive_device_name("Mozilla/5.0 (Linux; Android 13) Chrome/120") == "Chrome no Android"
    assert derive_device_name("Mozilla/5.0 (iPhone) Safari/605") == "Safari no iOS"
