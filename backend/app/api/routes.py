"""HTTP routes: list boards, list board labels and create cards."""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.dependencies import require_auth
from app.application.create_card import create_card as create_card_use_case
from app.application.list_labels import list_labels as list_labels_use_case
from app.application.list_lists import list_lists as list_lists_use_case
from app.config import settings
from app.infrastructure.trello_client import TrelloClient

router = APIRouter()


class CreateCardRequest(BaseModel):
    title: str
    board_id: str
    priority: str | None = None
    description: str | None = None
    label: str | None = None
    list_id: str | None = None


def get_client() -> TrelloClient:
    return TrelloClient(settings.trello_api_key, settings.trello_token)


@router.get("/boards", dependencies=[Depends(require_auth)])
async def list_boards(client: TrelloClient = Depends(get_client)) -> list[dict[str, str]]:
    try:
        return await client.list_boards()
    except httpx.HTTPStatusError as exc:
        raise _http_from_trello(exc, "erro ao listar boards") from exc


@router.get("/boards/{board_id}/labels", dependencies=[Depends(require_auth)])
async def list_board_labels(
    board_id: str,
    client: TrelloClient = Depends(get_client),
) -> list[dict[str, str]]:
    """Labels offered in the capture screen (priority labels are filtered out — FR-005)."""
    try:
        return await list_labels_use_case(client, board_id)
    except httpx.HTTPStatusError as exc:
        raise _http_from_trello(exc, "erro ao listar etiquetas") from exc


@router.get("/boards/{board_id}/lists", dependencies=[Depends(require_auth)])
async def list_board_lists(
    board_id: str,
    client: TrelloClient = Depends(get_client),
) -> list[dict[str, str]]:
    """Open lists offered as the destination of the card (FR-001)."""
    try:
        return await list_lists_use_case(client, board_id)
    except httpx.HTTPStatusError as exc:
        raise _http_from_trello(exc, "erro ao listar listas") from exc


@router.post("/cards", status_code=201, dependencies=[Depends(require_auth)])
async def create_card(
    req: CreateCardRequest,
    client: TrelloClient = Depends(get_client),
) -> dict[str, str]:
    try:
        card_id = await create_card_use_case(
            client, req.title, req.board_id, req.priority, req.description, req.label, req.list_id
        )
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
