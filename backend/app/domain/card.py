"""Card domain entity and its invariants (R3/R4)."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Card:
    title: str
    board_id: str
    priority: str | None = None

    def __post_init__(self) -> None:
        if not self.title or not self.title.strip():
            raise ValueError("title is required")
        if not self.board_id or not self.board_id.strip():
            raise ValueError("board_id is required")
