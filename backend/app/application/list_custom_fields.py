"""Use case: custom fields of a board, offered to the capture screen (013)."""
from app.infrastructure.trello_client import TrelloClient


async def list_custom_fields(client: TrelloClient, board_id: str) -> list[dict]:
    """Custom fields of the board, with their options, in the Trello order.

    The capture screen renders each one by its type; the priority control is fed by the field named
    "Prioridade" when it exists.
    """
    return await client.list_custom_fields(board_id)