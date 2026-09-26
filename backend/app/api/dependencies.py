"""FastAPI dependencies."""
from fastapi import HTTPException, Request


def require_auth(request: Request) -> None:
    """Gate: raises 401 when the request has no valid session (S1)."""
    if not getattr(request.state, "authenticated", False):
        raise HTTPException(status_code=401, detail="não autenticado")
