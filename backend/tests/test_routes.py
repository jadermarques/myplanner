"""Integration tests for the HTTP routes with a fake Trello client."""
import httpx
from fastapi.testclient import TestClient

from app.api.dependencies import require_auth
from app.api.routes import get_client
from app.main import app


class FakeTrelloClient:
    LABELS = {"Casa": "label-2", "Trabalho": "label-3"}
    PRIORITY_FIELD = {
        "id": "cf-prior",
        "name": "Prioridade",
        "type": "list",
        "options": [{"id": "opt-alta", "value": "Alta", "color": "orange"}],
    }

    def __init__(self) -> None:
        self.last_description: str | None = None
        self.last_label_ids: list[str] | None = None
        self.last_list_id: str | None = None
        self.last_start: str | None = None
        self.last_due: str | None = None
        self.last_due_reminder: int | None = None
        self.set_field_calls: list[tuple] = []
        self.custom_fields: list[dict] = [self.PRIORITY_FIELD]
        self.listed_labels_for: list[str] = []
        self.listed_lists_for: list[str] = []
        self.label_reads = 0
        self.fail_labels = False
        self.fail_lists = False

    async def list_boards(self) -> list[dict[str, str]]:
        return [{"id": "b1", "name": "Pessoal"}]

    async def get_first_list_id(self, board_id: str) -> str:
        return "list-1"

    async def find_label_ids_by_names(self, board_id: str, names: list[str]) -> list[str]:
        self.label_reads += 1
        ids: list[str] = []
        for name in names:
            label_id = self.LABELS.get(name)
            if label_id and label_id not in ids:
                ids.append(label_id)
        return ids

    async def list_labels(self, board_id: str) -> list[dict[str, str]]:
        self.listed_labels_for.append(board_id)
        if self.fail_labels:
            raise httpx.HTTPStatusError(
                "boom",
                request=httpx.Request("GET", "https://api.trello.com/1/boards/b1/labels"),
                response=httpx.Response(500),
            )
        return [{"name": "Alta", "color": "red"}, {"name": "Casa", "color": "green"}]

    async def list_lists(self, board_id: str) -> list[dict[str, str]]:
        self.listed_lists_for.append(board_id)
        if self.fail_lists:
            raise httpx.HTTPStatusError(
                "boom",
                request=httpx.Request("GET", "https://api.trello.com/1/boards/b1/lists"),
                response=httpx.Response(500),
            )
        return [
            {"id": "list-1", "name": "A fazer"},
            {"id": "list-2", "name": "Em andamento"},
        ]

    async def list_custom_fields(self, board_id: str) -> list[dict]:
        return self.custom_fields

    async def create_card(
        self, name: str, list_id: str, id_labels=None, description=None, *, start=None, due=None
    ) -> str:
        self.last_description = description
        self.last_label_ids = id_labels
        self.last_list_id = list_id
        self.last_start = start
        self.last_due = due
        return "card-1"

    async def set_custom_field_item(self, card_id: str, field_id: str, payload: dict) -> None:
        self.set_field_calls.append((card_id, field_id, payload))

    async def set_due_reminder(self, card_id: str, minutes: int) -> None:
        self.last_due_reminder = minutes


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
    assert resp.json() == {"card_id": "card-1", "unapplied": []}


def test_create_card_rejects_empty_title() -> None:
    client = _client()
    resp = client.post("/cards", json={"title": "   ", "board_id": "b1"})
    assert resp.status_code == 400


def test_create_card_ignores_a_priority_that_is_not_an_option() -> None:
    """R3 (amended by 013): unknown priority is not applied — never a 400."""
    client, fake = _client_with_fake()
    resp = client.post("/cards", json={"title": "x", "board_id": "b1", "priority": "Urgente"})
    assert resp.status_code == 201
    assert fake.set_field_calls == []


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


def test_list_board_labels_offers_every_board_label() -> None:
    """013/FR-011: priority is no longer a label, so no name is hidden."""
    client, fake = _client_with_fake()
    resp = client.get("/boards/b1/labels")
    assert resp.status_code == 200
    assert resp.json() == [{"name": "Alta", "color": "red"}, {"name": "Casa", "color": "green"}]
    assert fake.listed_labels_for == ["b1"]


def test_list_board_labels_requires_a_session() -> None:
    """S1: the new endpoint is protected like every other one."""
    app.dependency_overrides[get_client] = lambda: FakeTrelloClient()
    app.dependency_overrides.pop(require_auth, None)
    try:
        assert TestClient(app).get("/boards/b1/labels").status_code == 401
    finally:
        app.dependency_overrides[require_auth] = lambda: None


def test_list_board_labels_maps_a_trello_failure_to_502() -> None:
    fake = FakeTrelloClient()
    fake.fail_labels = True
    app.dependency_overrides[get_client] = lambda: fake
    app.dependency_overrides[require_auth] = lambda: None
    resp = TestClient(app).get("/boards/b1/labels")
    assert resp.status_code == 502


def test_create_card_forwards_every_chosen_label() -> None:
    """FR-005/R7: all the chosen labels reach the card as label ids."""
    client, fake = _client_with_fake()
    resp = client.post(
        "/cards", json={"title": "T", "board_id": "b1", "labels": ["Casa", "Trabalho"]}
    )
    assert resp.status_code == 201
    assert fake.last_label_ids == ["label-2", "label-3"]
    assert fake.label_reads == 1


def test_create_card_accepts_the_legacy_label_field() -> None:
    """FR-012: a cached PWA still sends the old `label`; it keeps working."""
    client, fake = _client_with_fake()
    resp = client.post("/cards", json={"title": "T", "board_id": "b1", "label": "Casa"})
    assert resp.status_code == 201
    assert fake.last_label_ids == ["label-2"]


def test_create_card_combines_the_legacy_field_with_the_list() -> None:
    client, fake = _client_with_fake()
    resp = client.post(
        "/cards",
        json={"title": "T", "board_id": "b1", "labels": ["Trabalho"], "label": "Casa"},
    )
    assert resp.status_code == 201
    assert fake.last_label_ids == ["label-3", "label-2"]


def test_create_card_keeps_the_valid_labels_when_one_is_gone() -> None:
    """R7 (amended by 010)/SC-003: a missing label is skipped one by one."""
    client, fake = _client_with_fake()
    resp = client.post(
        "/cards", json={"title": "T", "board_id": "b1", "labels": ["Casa", "Sumiu"]}
    )
    assert resp.status_code == 201
    assert fake.last_label_ids == ["label-2"]


def test_create_card_with_an_empty_label_list_keeps_the_current_payload() -> None:
    client, fake = _client_with_fake()
    resp = client.post("/cards", json={"title": "T", "board_id": "b1", "labels": []})
    assert resp.status_code == 201
    assert fake.last_label_ids is None


def test_create_card_without_labels_keeps_the_current_payload() -> None:
    """SC-004: no labels means exactly what happened before this feature."""
    client, fake = _client_with_fake()
    resp = client.post("/cards", json={"title": "T", "board_id": "b1"})
    assert resp.status_code == 201
    assert fake.last_label_ids is None


def test_list_board_lists_endpoint() -> None:
    """FR-001: the capture screen needs the open lists of the board."""
    client, fake = _client_with_fake()
    resp = client.get("/boards/b1/lists")
    assert resp.status_code == 200
    assert resp.json() == [
        {"id": "list-1", "name": "A fazer"},
        {"id": "list-2", "name": "Em andamento"},
    ]
    assert fake.listed_lists_for == ["b1"]


def test_list_board_lists_requires_a_session() -> None:
    """S1: the new endpoint is protected like every other one."""
    app.dependency_overrides[get_client] = lambda: FakeTrelloClient()
    app.dependency_overrides.pop(require_auth, None)
    try:
        assert TestClient(app).get("/boards/b1/lists").status_code == 401
    finally:
        app.dependency_overrides[require_auth] = lambda: None


def test_list_board_lists_maps_a_trello_failure_to_502() -> None:
    fake = FakeTrelloClient()
    fake.fail_lists = True
    app.dependency_overrides[get_client] = lambda: fake
    app.dependency_overrides[require_auth] = lambda: None
    resp = TestClient(app).get("/boards/b1/lists")
    assert resp.status_code == 502


def test_create_card_lands_in_the_chosen_list() -> None:
    """FR-006: the card is created in the list the user picked."""
    client, fake = _client_with_fake()
    resp = client.post("/cards", json={"title": "T", "board_id": "b1", "list_id": "list-2"})
    assert resp.status_code == 201
    assert fake.last_list_id == "list-2"


def test_a_foreign_list_never_receives_the_card() -> None:
    """SC-003: a manipulated request cannot create the card outside the board."""
    client, fake = _client_with_fake()
    resp = client.post("/cards", json={"title": "T", "board_id": "b1", "list_id": "list-de-outro"})
    assert resp.status_code == 201
    assert fake.last_list_id == "list-1"


def test_create_card_without_list_id_keeps_the_first_list() -> None:
    """SC-002: unchanged behaviour when the field is not touched."""
    client, fake = _client_with_fake()
    resp = client.post("/cards", json={"title": "T", "board_id": "b1"})
    assert resp.status_code == 201
    assert fake.last_list_id == "list-1"
