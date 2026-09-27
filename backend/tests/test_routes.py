"""Integration tests for the HTTP routes with a fake Trello client."""
from fastapi.testclient import TestClient

from app.api.dependencies import require_auth
from app.api.routes import get_client
from app.main import app


class FakeTrelloClient:
    def __init__(self) -> None:
        self.last_description: str | None = None

    async def list_boards(self) -> list[dict[str, str]]:
        return [{"id": "b1", "name": "Pessoal"}]

    async def get_first_list_id(self, board_id: str) -> str:
        return "list-1"

    async def find_label_id_by_name(self, board_id: str, name: str) -> str | None:
        return "label-1" if name == "Alta" else None

    async def create_card(self, name: str, list_id: str, id_labels=None, description=None) -> str:
        self.last_description = description
        return "card-1"


def _client() -> TestClient:
    app.dependency_overrides[get_client] = lambda: FakeTrelloClient()
    app.dependency_overrides[require_auth] = lambda: None
    return TestClient(app)


def _client_with_fake() -> tuple[TestClient, FakeTrelloClient]:
    fake = FakeTrelloClient()
    app.dependency_overrides[get_client] = lambda: fake
    app.dependency_overrides[require_auth] = lambda: None
    return TestClient(app), fake


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


def test_create_card_with_description() -> None:
    client, fake = _client_with_fake()
    resp = client.post(
        "/cards",
        json={"title": "Comprar leite", "board_id": "b1", "description": "linha 1\nlinha 2"},
    )
    assert resp.status_code == 201
    assert fake.last_description == "linha 1\nlinha 2"


def test_create_card_without_description_sends_none() -> None:
    client, fake = _client_with_fake()
    resp = client.post("/cards", json={"title": "Comprar leite", "board_id": "b1"})
    assert resp.status_code == 201
    assert fake.last_description is None


def test_create_card_normalizes_a_blank_description() -> None:
    client, fake = _client_with_fake()
    resp = client.post(
        "/cards", json={"title": "T", "board_id": "b1", "description": "   \n  "}
    )
    assert resp.status_code == 201
    assert fake.last_description is None


def test_create_card_rejects_description_above_the_limit() -> None:
    """R6: the limit is enforced by the server and never echoes the user's text (S8)."""
    client, fake = _client_with_fake()
    resp = client.post(
        "/cards", json={"title": "T", "board_id": "b1", "description": "x" * 2001}
    )
    assert resp.status_code == 400
    detail = resp.json()["detail"]
    assert "2000" in detail
    # nunca ecoa o conteúdo do usuário no erro (S8)
    assert "xxxx" not in detail
    assert fake.last_description is None


def test_description_does_not_replace_the_title() -> None:
    client, fake = _client_with_fake()
    resp = client.post(
        "/cards", json={"title": "   ", "board_id": "b1", "description": "só descrição"}
    )
    assert resp.status_code == 400
    assert fake.last_description is None


def test_there_is_no_card_editing_route() -> None:
    """FR-008: the description exists only at creation — no editing endpoint."""
    client = _client()
    assert client.patch("/cards/c1", json={"description": "x"}).status_code in (404, 405)
    assert client.put("/cards/c1", json={"description": "x"}).status_code in (404, 405)
