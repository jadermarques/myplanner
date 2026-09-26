"""Integration tests for the HTTP routes with a fake Trello client."""
from fastapi.testclient import TestClient

from app.api.routes import get_client
from app.main import app


class FakeTrelloClient:
    async def list_boards(self) -> list[dict[str, str]]:
        return [{"id": "b1", "name": "Pessoal"}]

    async def get_first_list_id(self, board_id: str) -> str:
        return "list-1"

    async def find_label_id_by_name(self, board_id: str, name: str) -> str | None:
        return "label-1" if name == "Alta" else None

    async def create_card(self, name: str, list_id: str, id_labels=None) -> str:
        return "card-1"


def _client() -> TestClient:
    app.dependency_overrides[get_client] = lambda: FakeTrelloClient()
    return TestClient(app)


def test_list_boards_endpoint() -> None:
    client = _client()
    resp = client.get("/boards")
    assert resp.status_code == 200
    assert resp.json() == [{"id": "b1", "name": "Pessoal"}]


def test_create_card_endpoint() -> None:
    client = _client()
    resp = client.post("/cards", json={"title": "Comprar leite", "board_id": "b1", "priority": "Alta"})
    assert resp.status_code == 201
    assert resp.json() == {"card_id": "card-1"}


def test_create_card_rejects_empty_title() -> None:
    client = _client()
    resp = client.post("/cards", json={"title": "   ", "board_id": "b1"})
    assert resp.status_code == 400


def test_create_card_rejects_invalid_priority() -> None:
    client = _client()
    resp = client.post("/cards", json={"title": "x", "board_id": "b1", "priority": "Urgente"})
    assert resp.status_code == 400
