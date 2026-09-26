"""Device storage in a gitignored JSON state file (no database)."""
import json
from pathlib import Path

from app.domain.device import Device


class DeviceStore:
    def __init__(self, path: Path) -> None:
        self._path = path

    def _read(self) -> list[dict]:
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []
        return data if isinstance(data, list) else []

    def _write(self, devices: list[dict]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(devices, ensure_ascii=False), encoding="utf-8")

    def list(self) -> list[Device]:
        return [Device(**item) for item in self._read()]

    def get(self, device_id: str) -> Device | None:
        for item in self._read():
            if item["id"] == device_id:
                return Device(**item)
        return None

    def add(self, device: Device) -> None:
        devices = [item for item in self._read() if item["id"] != device.id]
        devices.append(
            {
                "id": device.id,
                "name": device.name,
                "created_at": device.created_at,
                "last_used_at": device.last_used_at,
            }
        )
        self._write(devices)

    def touch(self, device_id: str, now: str) -> None:
        devices = self._read()
        for item in devices:
            if item["id"] == device_id:
                item["last_used_at"] = now
        self._write(devices)

    def remove(self, device_id: str) -> bool:
        devices = self._read()
        remaining = [item for item in devices if item["id"] != device_id]
        if len(remaining) == len(devices):
            return False
        self._write(remaining)
        return True
