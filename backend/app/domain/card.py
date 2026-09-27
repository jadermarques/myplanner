"""Card domain entity and its invariants (R3; R4 revoked by 006; R7 amended by 010; R8 added by 009)."""
from collections.abc import Iterable
from dataclasses import dataclass

MAX_DESCRIPTION_CHARS = 2000


@dataclass(frozen=True)
class Card:
    title: str
    board_id: str
    priority: str | None = None
    description: str | None = None
    labels: tuple[str, ...] = ()
    list_id: str | None = None

    def __post_init__(self) -> None:
        if not self.title or not self.title.strip():
            raise ValueError("title is required")
        if not self.board_id or not self.board_id.strip():
            raise ValueError("board_id is required")
        object.__setattr__(self, "description", _normalize_description(self.description))
        object.__setattr__(self, "labels", _normalize_labels(self.labels))
        object.__setattr__(self, "list_id", _normalize_list_id(self.list_id))


def _normalize_labels(labels: Iterable[str] | None) -> tuple[str, ...]:
    """Trim each name, drop blanks and repeats, keep the order chosen (R7, amended by 010).

    The names are labels already seen on the board: they are never validated here, because the
    board is the authority — a name it no longer has is simply not applied, while the remaining
    ones still are (FR-006). A repeated name never becomes two labels (FR-007).
    """
    if not labels:
        return ()
    names: list[str] = []
    for label in labels:
        text = (label or "").strip()
        if text and text not in names:
            names.append(text)
    return tuple(names)


def _normalize_list_id(list_id: str | None) -> str | None:
    """Trim the edges; blank means "use the first list of the board" (R8).

    Ownership is checked by the use case against the board: only the board can say which lists
    exist, so the domain just keeps the identifier clean.
    """
    if list_id is None:
        return None
    text = list_id.strip()
    return text or None


def _normalize_description(description: str | None) -> str | None:
    """Trim the edges, keep the content intact; blank means "no description" (FR-003).

    The message is pt-BR (it reaches the user) and quotes only the limit — never the
    text itself, which must not leak into errors or logs (S8).
    """
    if description is None:
        return None
    text = description.strip()
    if not text:
        return None
    if len(text) > MAX_DESCRIPTION_CHARS:
        raise ValueError(f"a descrição deve ter no máximo {MAX_DESCRIPTION_CHARS} caracteres")
    return text
