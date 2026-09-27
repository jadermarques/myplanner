"""Tests for the create_card application use case."""
import asyncio

import pytest

from app.application.create_card import create_card


PRIORITY_FIELD = {
    "id": "cf-prior",
    "name": "Prioridade",
    "type": "list",
    "options": [
        {"id": "opt-malta", "value": "Muito alta", "color": "red"},
        {"id": "opt-alta", "value": "Alta", "color": "orange"},
        {"id": "opt-media", "value": "Média", "color": "yellow"},
        {"id": "opt-baixa", "value": "Baixa", "color": "sky"},
        {"id": "opt-mbaixa", "value": "Muito baixa", "color": "blue"},
    ],
}


class RecordingClient:
    KNOWN_LABELS = {"Casa": "label-2", "Trabalho": "label-3"}

    def __init__(self) -> None:
        self.create_card_calls: list[tuple] = []
        self.create_card_kwargs: list[dict] = []
        self.board_lists: list[dict[str, str]] = []
        self.custom_fields: list[dict] = [PRIORITY_FIELD]
        self.set_field_calls: list[tuple] = []
        self.set_reminder_calls: list[tuple] = []
        self.fail_set_field = False
        self.label_reads = 0
        self.label_names_asked: list[list[str]] = []

    async def get_first_list_id(self, board_id: str) -> str:
        return "list-1"

    async def find_label_ids_by_names(self, board_id: str, names: list[str]) -> list[str]:
        self.label_reads += 1
        self.label_names_asked.append([*names])
        ids: list[str] = []
        for name in names:
            label_id = self.KNOWN_LABELS.get(name)
            if label_id and label_id not in ids:
                ids.append(label_id)
        return ids

    async def list_lists(self, board_id: str) -> list[dict[str, str]]:
        return self.board_lists

    async def list_custom_fields(self, board_id: str) -> list[dict]:
        return self.custom_fields

    async def create_card(
        self, name: str, list_id: str, id_labels=None, description=None, *, start=None, due=None
    ) -> str:
        self.create_card_calls.append((name, list_id, id_labels, description))
        self.create_card_kwargs.append({"start": start, "due": due})
        return "card-1"

    async def set_custom_field_item(self, card_id: str, field_id: str, payload: dict) -> None:
        if self.fail_set_field:
            raise RuntimeError("boom")
        self.set_field_calls.append((card_id, field_id, payload))

    async def set_due_reminder(self, card_id: str, minutes: int) -> None:
        self.set_reminder_calls.append((card_id, minutes))


def test_create_card_applies_priority_as_a_custom_field() -> None:
    """R3 (amended by 013): priority is a value of the "Prioridade" custom field, not a label."""
    client = RecordingClient()
    result = asyncio.run(create_card(client, "Comprar leite", "b1", "Alta"))
    assert result.card_id == "card-1"
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]
    assert client.set_field_calls == [("card-1", "cf-prior", {"idValue": "opt-alta"})]


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


def test_create_card_ignores_a_priority_that_is_not_an_option() -> None:
    """R3 (amended by 013): an unknown value simply is not applied — never a 400."""
    client = RecordingClient()
    result = asyncio.run(create_card(client, "Comprar leite", "b1", "Urgente"))
    assert result.card_id == "card-1"
    assert client.set_field_calls == []


def test_create_card_rejects_empty_title() -> None:
    client = RecordingClient()
    with pytest.raises(ValueError):
        asyncio.run(create_card(client, "   ", "b1", None, None))


def test_create_card_applies_the_chosen_label() -> None:
    """FR-005: the chosen label rides along with the card."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, ["Casa"]))
    assert client.create_card_calls == [("Comprar leite", "list-1", ["label-2"], None)]


def test_create_card_applies_every_chosen_label() -> None:
    """FR-002/FR-005/SC-002: two labels chosen, two labels applied, in the chosen order."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, ["Casa", "Trabalho"]))
    assert client.create_card_calls == [("Comprar leite", "list-1", ["label-2", "label-3"], None)]


def test_create_card_applies_priority_and_labels_independently() -> None:
    """Priority now goes to the custom field, while labels still go to idLabels."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", "Alta", None, ["Casa", "Trabalho"]))
    assert client.create_card_calls == [("Comprar leite", "list-1", ["label-2", "label-3"], None)]
    assert client.set_field_calls == [("card-1", "cf-prior", {"idValue": "opt-alta"})]


def test_create_card_reads_the_board_labels_only_once() -> None:
    """FR-002/SC-001: resolving N labels costs a single read of the board (P2)."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", "Alta", None, ["Casa", "Trabalho"]))
    assert client.label_reads == 1
    assert client.label_names_asked == [["Casa", "Trabalho"]]


def test_create_card_keeps_the_valid_labels_when_one_is_gone() -> None:
    """R7 (amended by 010)/SC-003: a missing label is skipped one by one."""
    client = RecordingClient()
    result = asyncio.run(create_card(client, "Comprar leite", "b1", None, None, ["Casa", "Sumiu"]))
    assert result.card_id == "card-1"
    assert client.create_card_calls == [("Comprar leite", "list-1", ["label-2"], None)]


def test_create_card_without_labels_sends_exactly_todays_payload() -> None:
    """SC-004: without labels, nothing changes in what the client receives."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, None))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_with_an_empty_label_list_sends_no_labels() -> None:
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, []))
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_ignores_labels_that_no_longer_exist() -> None:
    """R7: labels missing from the board must not fail nor block the card."""
    client = RecordingClient()
    result = asyncio.run(create_card(client, "Comprar leite", "b1", None, None, ["Sumiu"]))
    assert result.card_id == "card-1"
    assert client.create_card_calls == [("Comprar leite", "list-1", None, None)]


def test_create_card_normalizes_blank_labels() -> None:
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, ["   "]))
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


def test_create_card_sets_start_and_converts_due_to_utc() -> None:
    """013/FR-001 + 014/FR-004: start is now; due is Brazil → UTC."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, None, None, "2026-09-28T10:30"))
    kwargs = client.create_card_kwargs[0]
    assert kwargs["due"] == "2026-09-28T13:30:00.000Z"
    assert kwargs["start"] and kwargs["start"].endswith("Z")


def test_create_card_sets_the_reminder_only_when_there_is_a_due() -> None:
    """014/FR-008: dueReminder is never sent without a due date."""
    client = RecordingClient()
    asyncio.run(create_card(client, "Comprar leite", "b1", None, None, None, None, None, 5))
    assert client.set_reminder_calls == []

    client = RecordingClient()
    asyncio.run(
        create_card(client, "Comprar leite", "b1", None, None, None, None, "2026-09-28T10:30", 5)
    )
    assert client.set_reminder_calls == [("card-1", 5)]


def test_create_card_applies_custom_fields_by_type() -> None:
    """013/FR-006/FR-009: each type maps to its own payload."""
    client = RecordingClient()
    client.custom_fields = [
        {"id": "cf-check", "name": "Cartão sem relevância", "type": "checkbox", "options": []},
        {"id": "cf-num", "name": "Número", "type": "number", "options": []},
        {"id": "cf-text", "name": "Texto", "type": "text", "options": []},
    ]
    asyncio.run(
        create_card(
            client,
            "Comprar leite",
            "b1",
            None,
            None,
            None,
            None,
            None,
            None,
            [("cf-check", "true"), ("cf-num", "42"), ("cf-text", "oi")],
        )
    )
    assert client.set_field_calls == [
        ("card-1", "cf-check", {"value": {"checked": "true"}}),
        ("card-1", "cf-num", {"value": {"number": "42"}}),
        ("card-1", "cf-text", {"value": {"text": "oi"}}),
    ]


def test_create_card_ignores_a_custom_field_the_board_does_not_have() -> None:
    client = RecordingClient()
    client.custom_fields = []
    asyncio.run(
        create_card(client, "Comprar leite", "b1", None, None, None, None, None, None, [("cf-x", "1")])
    )
    assert client.set_field_calls == []


def test_create_card_reports_a_field_that_failed_to_apply() -> None:
    """013/FR-009: a failed custom field never blocks the card and is reported."""
    client = RecordingClient()
    client.custom_fields = [{"id": "cf-text", "name": "Texto", "type": "text", "options": []}]
    client.fail_set_field = True
    result = asyncio.run(
        create_card(
            client, "Comprar leite", "b1", None, None, None, None, None, None, [("cf-text", "oi")]
        )
    )
    assert result.card_id == "card-1"
    assert result.unapplied == ("Texto",)
