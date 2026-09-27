"""Use case: open lists of a board, offered as the destination of the card (FR-001)."""
from app.infrastructure.trello_client import TrelloClient


async def list_lists(client: TrelloClient, board_id: str) -> list[dict[str, str]]:
    """Lists of the board in board order.

    The first one is the default destination of a card (R8/FR-002); archived lists are not open
    lists and therefore are never offered.
    """
    return await client.list_lists(board_id)
