"""Use case: create a Trello card from title + board + optional priority, description, labels, list."""
from app.config import settings
from app.domain.card import Card
from app.infrastructure.trello_client import TrelloClient


async def create_card(
    client: TrelloClient,
    title: str,
    board_id: str,
    priority: str | None = None,
    description: str | None = None,
    labels: list[str] | None = None,
    list_id: str | None = None,
) -> str:
    card = Card(
        title=title,
        board_id=board_id,
        priority=priority,
        description=description,
        labels=tuple(labels) if labels else (),
        list_id=list_id,
    )
    if card.priority and card.priority not in settings.trello.priority_labels:
        raise ValueError(f"invalid priority: {card.priority}")

    # R8: only a list that really belongs to this board may receive the card. A list from another
    # board (or one deleted in the meantime) falls back to the first open list — the behaviour of
    # every card created before this feature — instead of failing the capture.
    target = card.list_id
    if target:
        allowed = {item["id"] for item in await client.list_lists(card.board_id)}
        if target not in allowed:
            target = None
    resolved_list_id = target or await client.get_first_list_id(card.board_id)

    # R7 (amended by 010): the board is the authority on which labels exist. Every name — the
    # priority label included — is resolved in a SINGLE read of the board; a name the board no
    # longer has is skipped one by one (the remaining ones still apply) and a repeated name never
    # becomes two labels.
    asked = [name for name in (card.priority, *card.labels) if name]
    label_ids = await client.find_label_ids_by_names(card.board_id, asked) if asked else []

    return await client.create_card(card.title, resolved_list_id, label_ids or None, card.description)
