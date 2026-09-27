"""Tests for the list_labels use case (priority is no longer a label — R3 amended by 013)."""
import asyncio

from app.application.list_labels import list_labels


class FakeClient:
    def __init__(self, labels: list[dict[str, str]]) -> None:
        self._labels = labels
        self.calls: list[str] = []

    async def list_labels(self, board_id: str) -> list[dict[str, str]]:
        self.calls.append(board_id)
        return self._labels


def test_list_labels_returns_every_board_label() -> None:
    """013/FR-011: names that used to mean priority are now ordinary labels."""
    client = FakeClient(
        [
            {"name": "Alta", "color": "red"},
            {"name": "Casa", "color": "green"},
            {"name": "Muito baixa", "color": "sky"},
        ]
    )
    names = [label["name"] for label in asyncio.run(list_labels(client, "b1"))]
    assert names == ["Alta", "Casa", "Muito baixa"]


def test_list_labels_preserves_the_board_order() -> None:
    client = FakeClient(
        [{"name": "Zebra", "color": "green"}, {"name": "Casa", "color": "blue"}]
    )
    names = [label["name"] for label in asyncio.run(list_labels(client, "b1"))]
    assert names == ["Zebra", "Casa"]


def test_list_labels_is_empty_when_the_board_has_no_labels() -> None:
    """FR-008: no label to offer means the item will not be rendered."""
    client = FakeClient([])
    assert asyncio.run(list_labels(client, "b1")) == []


def test_list_labels_reads_the_requested_board() -> None:
    client = FakeClient([])
    asyncio.run(list_labels(client, "b7"))
    assert client.calls == ["b7"]
