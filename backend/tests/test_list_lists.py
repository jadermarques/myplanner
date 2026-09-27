"""Tests for the list_lists use case (FR-001: the lists offered in the capture screen)."""
import asyncio

from app.application.list_lists import list_lists


class FakeClient:
    def __init__(self, lists: list[dict[str, str]]) -> None:
        self._lists = lists
        self.calls: list[str] = []

    async def list_lists(self, board_id: str) -> list[dict[str, str]]:
        self.calls.append(board_id)
        return self._lists


def test_list_lists_returns_the_open_lists_in_board_order() -> None:
    client = FakeClient(
        [
            {"id": "l1", "name": "A fazer"},
            {"id": "l2", "name": "Em andamento"},
        ]
    )
    assert asyncio.run(list_lists(client, "b1")) == [
        {"id": "l1", "name": "A fazer"},
        {"id": "l2", "name": "Em andamento"},
    ]


def test_list_lists_is_empty_when_the_board_has_no_open_lists() -> None:
    """FR-005: no list to offer means the field will not be rendered."""
    client = FakeClient([])
    assert asyncio.run(list_lists(client, "b1")) == []


def test_list_lists_reads_the_requested_board() -> None:
    client = FakeClient([])
    asyncio.run(list_lists(client, "b9"))
    assert client.calls == ["b9"]
