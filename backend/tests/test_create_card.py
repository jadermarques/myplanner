"""Tests for the create_card application use case."""
import asyncio

import pytest

from app.application.create_card import create_card


class RecordingClient:
    def __init__(self) -> None:
        self.create_card_calls: list[tuple] = []

    async def get_first_list_id(self, board_id: str) -> str:
        return "list-1"

    async def find_label_id_by_name(self, board_id: str, name: str) -> str | None:
        return "label-1" if name == "Alta" else None

    async def create_card(self, name: str, list_id: str, id_labels=None) -> str:
        self.create_card_calls.append((name, list_id, id_labels))
        return "card-1"


def test_create_card_applies_label() -> None:
    client = RecordingClient()
    card_id = asyncio.run(create_card(client, "Comprar leite", "b1", "Alta"))
    assert card_id == "card-1"
    assert client.create_card_calls == [("Comprar leite", "list-1", ["label-1"])]


def test_create_card_without_priority() -> None:
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None))
    assert client.create_card_calls == [("Comprar leite", "list-1", None)]


def test_create_card_rejects_invalid_priority() -> None:
    client = RecordingClient()
    with pytest.raises(ValueError):
        asyncio.run(create_card(client, "Comprar leite", "b1", "Urgente"))


def test_create_card_rejects_empty_title() -> None:
    client = RecordingClient()
    with pytest.raises(ValueError):
        asyncio.run(create_card(client, "   ", "b1", None))
