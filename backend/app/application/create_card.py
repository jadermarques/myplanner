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
) -> str:
    card = Card(
        title=title,
        board_id=board_id,
        priority=priority,
        description=description,
        label=label,
    )
    if card.priority and card.priority not in settings.trello.priority_labels:
        raise ValueError(f"invalid priority: {card.priority}")

    list_id = await client.get_first_list_id(card.board_id)
    label_ids: list[str] = []
    # R7: a label missing from the board is silently skipped — the card is never blocked by it.
    for name in (card.priority, card.label):
        if not name:
            continue
        label_id = await client.find_label_id_by_name(card.board_id, name)
        if label_id and label_id not in label_ids:
            label_ids.append(label_id)

    return await client.create_card(card.title, list_id, label_ids or None, card.description)
