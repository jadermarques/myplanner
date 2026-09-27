"""Use case: offer the board labels that are not already used as priority (R3/FR-005)."""
from app.config import settings
from app.infrastructure.trello_client import TrelloClient


async def list_labels(client: TrelloClient, board_id: str) -> list[dict[str, str]]:
    """Labels of the board, in the Trello order, without the ones that mean priority.

    The priority labels already have their own control, so offering them again would allow the
    same label to be chosen twice (R3) and would only add noise to the capture screen.
    """
    labels = await client.list_labels(board_id)
    taken = set(settings.trello.priority_labels)
    return [label for label in labels if label["name"] not in taken]
