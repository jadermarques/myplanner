"""Use case: offer the board labels (priority is no longer a label — R3 amended by 013)."""
from app.infrastructure.trello_client import TrelloClient


async def list_labels(client: TrelloClient, board_id: str) -> list[dict[str, str]]:
    """Labels of the board, in the Trello order.

    Before 013, the labels whose name matched a priority were hidden because priority used to be a
    label. With priority now being a custom field, every board label is offered as a tag.
    """
    return await client.list_labels(board_id)
