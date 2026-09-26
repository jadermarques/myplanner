"""Tests for the Card domain entity."""
import pytest

from app.domain.card import Card


def test_card_requires_non_empty_title() -> None:
    with pytest.raises(ValueError):
        Card(title="   ", board_id="board-1")


def test_card_requires_non_empty_board_id() -> None:
    with pytest.raises(ValueError):
        Card(title="Comprar leite", board_id="")


def test_card_priority_is_optional() -> None:
    card = Card(title="Comprar leite", board_id="board-1")
    assert card.priority is None


def test_card_stores_fields() -> None:
    card = Card(title="Comprar leite", board_id="board-1", priority="Alta")
    assert card.title == "Comprar leite"
    assert card.board_id == "board-1"
    assert card.priority == "Alta"
