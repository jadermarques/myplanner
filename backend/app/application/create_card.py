"""Use case: create a Trello card from title + board + optional priority, description and label."""
from app.config import settings
from app.domain.card import Card
from app.infrastructure.trello_client import TrelloClient


async def create_card(
    client: TrelloClient,
    title: str,
    board_id: str,
    priority: str | None = None,
    description: str | None = None,
    label: str | None = None,
    list_id: str | None = None,
) -> str:
    card = Card(
        title=title,
        board_id=board_id,
        priority=priority,
        description=description,
        label=label,
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

    label_ids: list[str] = []
    # R7: a label missing from the board is silently skipped — the card is never blocked by it.
    for name in (card.priority, card.label):
        if not name:
            continue
        label_id = await client.find_label_id_by_name(card.board_id, name)
        if label_id and label_id not in label_ids:
            label_ids.append(label_id)

    return await client.create_card(card.title, resolved_list_id, label_ids or None, card.description)
    # R7: a label missing from the board is silently skipped — the card is never blocked by it.
    for name in (card.priority, card.label):
        if not name:
            continue
        label_id = await client.find_label_id_by_name(card.board_id, name)
        if label_id and label_id not in label_ids:
            label_ids.append(label_id)

    return await client.create_card(card.title, list_id, label_ids or None, card.description)
