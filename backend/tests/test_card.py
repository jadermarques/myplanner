"""Tests for the Card domain entity."""
import pytest

from app.domain.card import MAX_DESCRIPTION_CHARS, Card


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


def test_card_description_is_optional() -> None:
    assert Card(title="Comprar leite", board_id="board-1").description is None


def test_card_blank_description_becomes_none() -> None:
    for blank in ("", "   ", "\n\n", "  \n \t "):
        assert Card(title="T", board_id="b", description=blank).description is None


def test_card_keeps_the_description_content_intact() -> None:
    text = "linha 1\nlinha 2 com acento é e emoji 🚀"
    card = Card(title="T", board_id="b", description=f"  {text}  ")
    assert card.description == text


def test_card_accepts_description_at_the_limit() -> None:
    card = Card(title="T", board_id="b", description="x" * MAX_DESCRIPTION_CHARS)
    assert card.description == "x" * MAX_DESCRIPTION_CHARS


def test_card_rejects_description_above_the_limit() -> None:
    """R6: the description is capped at MAX_DESCRIPTION_CHARS characters."""
    with pytest.raises(ValueError):
        Card(title="T", board_id="b", description="x" * (MAX_DESCRIPTION_CHARS + 1))


def test_card_without_labels_stays_empty() -> None:
    """R7 (amended by 010): labels are optional and start empty."""
    assert Card(title="T", board_id="b").labels == ()


def test_card_normalizes_blank_labels() -> None:
    """R7: a blank name means "no label"."""
    for blank in ("", "   ", "\n\n", "  \t "):
        assert Card(title="T", board_id="b", labels=[blank]).labels == ()


def test_card_keeps_the_label_names_intact() -> None:
    assert Card(title="T", board_id="b", labels=["  Casa  "]).labels == ("Casa",)


def test_card_accepts_several_labels_in_the_chosen_order() -> None:
    """FR-002/FR-005: as many labels as the board offers, in the order chosen."""
    card = Card(title="T", board_id="b", labels=["Casa", "Trabalho", "Financeiro"])
    assert card.labels == ("Casa", "Trabalho", "Financeiro")


def test_card_drops_repeated_labels() -> None:
    """FR-007: the same name must never become two labels."""
    card = Card(title="T", board_id="b", labels=["Casa", "Casa", " Trabalho ", "Casa"])
    assert card.labels == ("Casa", "Trabalho")


def test_card_drops_blank_names_but_keeps_the_others() -> None:
    """R7: one unusable name must not discard the usable ones (FR-006)."""
    card = Card(title="T", board_id="b", labels=["Casa", "   ", "", "Trabalho"])
    assert card.labels == ("Casa", "Trabalho")


def test_card_without_list_stays_none() -> None:
    """R8: the destination list is optional."""
    assert Card(title="T", board_id="b").list_id is None


def test_card_normalizes_a_blank_list_id() -> None:
    """R8: a blank list means "let the app choose"."""
    for blank in ("", "   ", "\n"):
        assert Card(title="T", board_id="b", list_id=blank).list_id is None


def test_card_keeps_the_list_id_intact() -> None:
    assert Card(title="T", board_id="b", list_id="  list-2  ").list_id == "list-2"
