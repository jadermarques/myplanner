"""Use case: create a Trello card from title + board + optional priority, description, labels, list, dates, custom fields."""
from dataclasses import dataclass
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from app.domain.card import Card
from app.infrastructure.trello_client import TrelloClient

PRIORITY_FIELD_NAME = "Prioridade"
BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")


@dataclass(frozen=True)
class CreateCardResult:
    """The created card and the names of the extra values that failed to apply (best-effort)."""

    card_id: str
    unapplied: tuple[str, ...] = ()


async def create_card(
    client: TrelloClient,
    title: str,
    board_id: str,
    priority: str | None = None,
    description: str | None = None,
    labels: list[str] | None = None,
    list_id: str | None = None,
    due: str | None = None,
    due_reminder: int | None = None,
    custom_fields: list[tuple[str, str]] | None = None,
) -> CreateCardResult:
    card = Card(
        title=title,
        board_id=board_id,
        priority=priority,
        description=description,
        labels=tuple(labels) if labels else (),
        list_id=list_id,
        due=due,
        due_reminder=due_reminder,
        custom_fields=tuple(custom_fields) if custom_fields else (),
    )

    # R8: only a list that really belongs to this board may receive the card; otherwise the first
    # open list is used — never failing the capture.
    target = card.list_id
    if target:
        allowed = {item["id"] for item in await client.list_lists(card.board_id)}
        if target not in allowed:
            target = None
    resolved_list_id = target or await client.get_first_list_id(card.board_id)

    # R7 (amended by 010): the board is the authority on which labels exist. Priority is NO LONGER a
    # label (R3 amended by 013), so only card.labels are resolved here.
    label_ids = (
        await client.find_label_ids_by_names(card.board_id, list(card.labels)) if card.labels else []
    )

    # R9: custom fields are applied after creation, best-effort. One read of the board's fields.
    board_fields = await client.list_custom_fields(card.board_id)
    fields_by_id = {field["id"]: field for field in board_fields}
    priority_field = next(
        (field for field in board_fields if field["name"] == PRIORITY_FIELD_NAME and field["type"] == "list"),
        None,
    )

    to_set: list[tuple[str, dict]] = []
    if card.priority and priority_field:
        option_id = _option_id(priority_field, card.priority)
        if option_id:
            to_set.append((priority_field["id"], {"idValue": option_id}))

    for field_id, value in card.custom_fields:
        field = fields_by_id.get(field_id)
        if field is None or not str(value).strip():
            continue
        payload = _payload(field, str(value))
        if payload is not None:
            to_set.append((field_id, payload))

    # start = the moment the card is added (013/FR-001); due is converted from Brazil to UTC (014/FR-004).
    start = _iso_utc(datetime.now(timezone.utc))
    due_utc = _to_utc(card.due) if card.due else None

    card_id = await client.create_card(
        card.title,
        resolved_list_id,
        label_ids or None,
        card.description,
        start=start,
        due=due_utc,
    )

    unapplied: list[str] = []
    if due_utc and card.due_reminder is not None:
        try:
            await client.set_due_reminder(card_id, card.due_reminder)
        except Exception:  # noqa: BLE001 — best-effort, the card already exists
            unapplied.append("lembrete")

    for field_id, payload in to_set:
        name = (fields_by_id.get(field_id) or {}).get("name") or field_id
        try:
            await client.set_custom_field_item(card_id, field_id, payload)
        except Exception:  # noqa: BLE001 — best-effort, the card already exists
            unapplied.append(name)

    return CreateCardResult(card_id=card_id, unapplied=tuple(unapplied))


def _option_id(field: dict, value: str) -> str | None:
    for option in field.get("options") or []:
        if option.get("value") == value:
            return option.get("id")
    return None


def _payload(field: dict, value: str) -> dict | None:
    ftype = field.get("type")
    if ftype == "checkbox":
        checked = "true" if value.lower() in ("true", "1", "sim", "yes") else "false"
        return {"value": {"checked": checked}}
    if ftype == "number":
        return {"value": {"number": value}}
    if ftype == "text":
        return {"value": {"text": value}}
    if ftype == "date":
        return {"value": {"date": value}}
    if ftype == "list":
        option_id = _option_id(field, value)
        return {"idValue": option_id} if option_id else None
    return None  # unknown type: ignore


def _to_utc(local_iso: str) -> str:
    dt = datetime.fromisoformat(local_iso)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=BRAZIL_TZ)
    return _iso_utc(dt)


def _iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")

