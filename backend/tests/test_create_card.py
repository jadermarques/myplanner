"""Tests for the create_card application use case."""
import asyncio

import pytest

from app.application.create_card import create_card


class RecordingClient:
    def __init__(self) -> None:
        self.create_card_calls: list[tuple] = []
        self.board_lists: list[dict[str, str]] = []

    async def get_first_list_id(self, board_id: str) -> str:
        return "list-1"

    async def find_label_id_by_name(self, board_id: str, name: str) -> str | None:
        return {"Alta": "label-1", "Casa": "label-2"}.get(name)

    async def list_lists(self, board_id: str) -> list[dict[str, str]]:
        return self.board_lists

    async def create_card(self, name: str, list_id: str, id_labels=None, description=None) -> str:
        self.create_card_calls.append((name, list_id, id_labels, description))
        return "card-1"


def test_create_card_applies_label() -> None:
    client = RecordingClient()
    card_id = asyncio.run(create_card(client, "Comprar leite", "b1", "Alta"))
    assert card_id == "card-1"
    assert client.create_card_calls == [("Comprar leite", "list-1", ["label-1"], None)]


def test_create_card_without_priority() -> None:
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_forwards_the_description() -> None:
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, "linha 1\nlinha 2"))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, "linha 1\nlinha 2")]


def test_create_card_normalizes_a_blank_description() -> None:
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, "   "))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_rejects_description_above_the_limit() -> None:
    client = RecordingClient()
    with pytest.raises(ValueError):
        asyncio.run(create_card(client, "T", "b1", None, "x" * 2001))


def test_create_card_rejects_invalid_priority() -> None:
    client = RecordingClient()
    with pytest.raises(ValueError):
        asyncio.run(create_card(client, "Comprar leite", "b1", "Urgente"))


def test_create_card_rejects_empty_title() -> None:
    client = RecordingClient()
    with pytest.raises(ValueError):
        asyncio.run(create_card(client, "   ", "b1", None, None))


def test_create_card_applies_the_label() -> None:
    """FR-006/FR-009: the chosen label rides along with the card."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, "Casa"))
    assert client.create_card_calls == [("Comprar leite", "list-1", ["label-2"], None)]


def test_create_card_applies_priority_and_label_together() -> None:
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", "Alta", None, "Casa"))
    assert client.create_card_calls == [("Comprar leite", "list-1", ["label-1", "label-2"], None)]


def test_create_card_without_label_sends_exactly_todays_payload() -> None:
    """SC-002: without a label, nothing changes in what the client receives."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, None))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_ignores_a_label_that_no_longer_exists() -> None:
    """R7: a label missing from the board must not fail nor block the card."""
    client = RecordingClient()
    card_id = asyncio.run(create_card(client, "Comprar leite", "b1", None, None, "Sumiu"))
    assert card_id == "card-1"
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_normalizes_a_blank_label() -> None:
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, "   "))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_uses_the_chosen_list() -> None:
    """FR-006: a list that belongs to the board is honoured."""
    client = RecordingClient()
    client.board_lists = [{"id": "list-2", "name": "Em andamento"}]
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, None, "list-2"))
    assert client.create_card_calls == [("Comprar leite", "list-2", None, None)]


def test_create_card_ignores_a_list_from_another_board() -> None:
    """R8/SC-003: a list that does not belong to the board never receives the card."""
    client = RecordingClient()
    client.board_lists = [{"id": "list-1", "name": "A fazer"}]
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, None, "list-de-outro-board"))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_falls_back_when_the_chosen_list_was_deleted() -> None:
    """R8/SC-004: a list deleted between loading and saving must not block the card."""
    client = RecordingClient()
    client.board_lists = []
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, None, "list-apagada"))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_without_list_keeps_todays_behaviour() -> None:
    """SC-002: no list_id means exactly what happened before this feature."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, None, None))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]
    assert client.board_lists == []
