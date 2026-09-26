"""HTTP routes: list boards and create cards."""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.application.create_card import create_card as create_card_use_case
from app.config import settings
from app.infrastructure.trello_client import TrelloClient

router = APIRouter()


class CreateCardRequest(BaseModel):
    title: str
    board_id: str
    priority: str | None = None


def get_client() -> TrelloClient:
    return TrelloClient(settings.trello_api_key, settings.trello_token)


@router.get("/boards")
async def list_boards(client: TrelloClient = Depends(get_client)) -> list[dict[str, str]]:
    try:
        return await client.list_boards()
    except httpx.HTTPStatusError as exc:
        raise _http_from_trello(exc, "erro ao listar boards") from exc


@router.post("/cards", status_code=201)
async def create_card(
    req: CreateCardRequest,
    client: TrelloClient = Depends(get_client),
) -> dict[str, str]:
    try:
        card_id = await create_card_use_case(client, req.title, req.board_id, req.priority)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        raise _http_from_trello(exc, "erro ao criar card") from exc
    return {"card_id": card_id}


def _http_from_trello(exc: httpx.HTTPStatusError, fallback: str) -> HTTPException:
    status = exc.response.status_code
    if status == 401:
        return HTTPException(status_code=401, detail="token inválido")
    if status == 429:
        return HTTPException(status_code=429, detail="limite de requisições atingido")
    return HTTPException(status_code=502, detail=fallback)
