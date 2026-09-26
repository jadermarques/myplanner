"""Authentication routes (login, set/change password, logout, status)."""
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from app.api.dependencies import require_auth
from app.application.auth import (
    AuthError,
    change_password,
    get_password_store,
    is_password_set,
    login,
    set_password,
)
from app.application.devices import (
    DEVICE_COOKIE,
    DEVICE_COOKIE_MAX_AGE,
    get_device_store,
    register_device,
)
from app.config import settings
from app.domain.password import WeakPasswordError
from app.infrastructure.security import (
    CSRF_COOKIE,
    SESSION_COOKIE,
    SESSION_MAX_AGE_SECONDS,
    LockoutTracker,
    SessionManager,
    new_csrf_token,
)
from app.infrastructure.totp import verify_totp

router = APIRouter(prefix="/auth")

_sessions = SessionManager(settings.session_secret)
_lockout = LockoutTracker()


class PasswordBody(BaseModel):
    password: str
    totp: str | None = None


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


def _start_session(response: Response, device_id: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        _sessions.create(device_id),
        httponly=True,
        samesite="strict",
        max_age=SESSION_MAX_AGE_SECONDS,
    )
    response.set_cookie(
        CSRF_COOKIE,
        new_csrf_token(),
        httponly=False,
        samesite="strict",
        max_age=SESSION_MAX_AGE_SECONDS,
    )


def _set_device_cookie(response: Response, device_id: str) -> None:
    response.set_cookie(
        DEVICE_COOKIE,
        device_id,
        httponly=True,
        samesite="strict",
        max_age=DEVICE_COOKIE_MAX_AGE,
    )


def _registered_device(request: Request):
    store = get_device_store()
    device_id = request.cookies.get(DEVICE_COOKIE, "")
    return store, (device_id, store.get(device_id) if device_id else None)


@router.get("/status")
def status(request: Request) -> dict[str, bool]:
    _, (_, device) = _registered_device(request)
    return {
        "password_set": is_password_set(get_password_store()),
        "authenticated": getattr(request.state, "authenticated", False),
        "device_registered": device is not None,
    }


@router.post("/set-password")
def set_password_route(body: PasswordBody, request: Request, response: Response) -> dict:
    try:
        set_password(get_password_store(), body.password)
    except (AuthError, WeakPasswordError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    # Bootstrap: register the first device without TOTP.
    store, (_, device) = _registered_device(request)
    if device is None:
        device = register_device(store, request.headers.get("user-agent", ""))
    _set_device_cookie(response, device.id)
    _start_session(response, device.id)
    return {}


@router.post("/login")
def login_route(body: PasswordBody, request: Request, response: Response) -> dict:
    if _lockout.seconds_until_unlock() > 0:
        raise HTTPException(status_code=429, detail="muitas tentativas; tente novamente mais tarde")
    try:
        ok = login(get_password_store(), body.password)
    except AuthError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not ok:
        _lockout.record_failure()
        raise HTTPException(status_code=401, detail="Senha incorreta.")
    _lockout.record_success()

    store, (_, device) = _registered_device(request)
    if device is None:
        # New device → TOTP is required (S4).
        if not settings.app_totp_secret:
            raise HTTPException(status_code=400, detail="TOTP não configurado neste servidor")
        if not body.totp or not verify_totp(settings.app_totp_secret, body.totp):
            raise HTTPException(status_code=401, detail="Código TOTP inválido.")
        device = register_device(store, request.headers.get("user-agent", ""))
        _set_device_cookie(response, device.id)
    _start_session(response, device.id)
    return {}


@router.post("/logout")
def logout_route(response: Response) -> dict:
    response.delete_cookie(SESSION_COOKIE)
    response.delete_cookie(CSRF_COOKIE)
    return {}


@router.post("/change-password")
def change_password_route(
    body: ChangePasswordBody,
    _: None = Depends(require_auth),
) -> dict:
    try:
        change_password(get_password_store(), body.current_password, body.new_password)
    except (AuthError, WeakPasswordError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {}

