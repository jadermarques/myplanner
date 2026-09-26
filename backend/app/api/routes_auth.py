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

router = APIRouter(prefix="/auth")

_sessions = SessionManager(settings.session_secret)
_lockout = LockoutTracker()


class PasswordBody(BaseModel):
    password: str


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


def _start_session(response: Response) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        _sessions.create(),
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


@router.get("/status")
def status(request: Request) -> dict[str, bool]:
    return {
        "password_set": is_password_set(get_password_store()),
        "authenticated": getattr(request.state, "authenticated", False),
    }


@router.post("/set-password")
def set_password_route(body: PasswordBody, response: Response) -> dict:
    try:
        set_password(get_password_store(), body.password)
    except (AuthError, WeakPasswordError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    _start_session(response)
    return {}


@router.post("/login")
def login_route(body: PasswordBody, response: Response) -> dict:
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
    _start_session(response)
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
