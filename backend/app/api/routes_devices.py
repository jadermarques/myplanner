"""Device routes: list and revoke."""
from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import require_auth
from app.application.devices import (
    DeviceError,
    get_device_store,
    list_devices,
    revoke_device,
)

router = APIRouter(prefix="/devices")


@router.get("", dependencies=[Depends(require_auth)])
def devices() -> list[dict[str, str]]:
    store = get_device_store()
    return [
        {
            "id": d.id,
            "name": d.name,
            "created_at": d.created_at,
            "last_used_at": d.last_used_at,
        }
        for d in list_devices(store)
    ]


@router.post("/{device_id}/revoke", dependencies=[Depends(require_auth)])
def revoke(device_id: str) -> dict:
    try:
        revoke_device(get_device_store(), device_id)
    except DeviceError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {}
