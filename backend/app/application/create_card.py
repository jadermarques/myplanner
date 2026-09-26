"""Use case: create a Trello card from title + board + optional priority."""
from app.config import settings
from app.domain.card import Card
from app.infrastructure.trello_client import TrelloClient


async def create_card(
    client: TrelloClient,
    title: str,
    board_id: str,
    priority: str | None = None,
) -> str:
    card = Card(title=title, board_id=board_id, priority=priority)
    if card.priority and card.priority not in settings.trello.priority_labels:
        raise ValueError(f"invalid priority: {card.priority}")

    list_id = await client.get_first_list_id(card.board_id)
    label_ids: list[str] = []
    if card.priority:
        label_id = await client.find_label_id_by_name(card.board_id, card.priority)
        if label_id:
            label_ids.append(label_id)

    return await client.create_card(card.title, list_id, label_ids or None)
