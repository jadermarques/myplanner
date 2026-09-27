"""Card domain entity and its invariants (R3; R4 revoked by 006; R7 added by 008; R8 added by 009)."""
from dataclasses import dataclass

MAX_DESCRIPTION_CHARS = 2000


@dataclass(frozen=True)
class Card:
    title: str
    board_id: str
    priority: str | None = None
    description: str | None = None
    label: str | None = None
    list_id: str | None = None

    def __post_init__(self) -> None:
        if not self.title or not self.title.strip():
            raise ValueError("title is required")
        if not self.board_id or not self.board_id.strip():
            raise ValueError("board_id is required")
        object.__setattr__(self, "description", _normalize_description(self.description))
        object.__setattr__(self, "label", _normalize_label(self.label))
        object.__setattr__(self, "list_id", _normalize_list_id(self.list_id))


def _normalize_label(label: str | None) -> str | None:
    """Trim the edges; blank means "no label" (R7).

    The label is only a name already seen on the board: it is never validated here, because
    the board is the authority — a label that no longer exists simply is not applied.
    """
    if label is None:
        return None
    text = label.strip()
    return text or None


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
