"""Async Trello REST client (httpx) with exponential backoff on 429."""
import asyncio

import httpx

TRELLO_BASE_URL = "https://api.trello.com/1"


class TrelloClient:
    def __init__(
        self,
        api_key: str,
        token: str,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
        max_retries: int = 3,
        backoff_base: float = 1.0,
    ) -> None:
        self._auth = {"key": api_key, "token": token}
        self._max_retries = max_retries
        self._backoff_base = backoff_base
        self._client = httpx.AsyncClient(base_url=TRELLO_BASE_URL, transport=transport)

    async def _request(
        self,
        method: str,
        url: str,
        *,
        params: dict | None = None,
        json: dict | None = None,
    ) -> httpx.Response:
        delay = self._backoff_base
        for attempt in range(self._max_retries):
            resp = await self._client.request(method, url, params=params, json=json)
            if resp.status_code == 429 and attempt < self._max_retries - 1:
                await asyncio.sleep(delay)
                delay *= 2
                continue
            resp.raise_for_status()
            return resp
        raise RuntimeError("unreachable")  # pragma: no cover

    async def list_boards(self) -> list[dict[str, str]]:
        resp = await self._request("GET", "/members/me/boards", params={**self._auth, "fields": "id,name"})
        return [{"id": b["id"], "name": b["name"]} for b in resp.json()]

    async def get_first_list_id(self, board_id: str) -> str:
        resp = await self._request("GET", f"/boards/{board_id}/lists", params={**self._auth, "filter": "open"})
        lists = resp.json()
        if not lists:
            raise ValueError("board has no open lists")
        return lists[0]["id"]

    async def find_label_ids_by_names(self, board_id: str, names: list[str]) -> list[str]:
        """Resolve several label names with a SINGLE read of the board (FR-002/FR-005).

        Missing names are skipped one by one (R7, amended by 010) and a repeated name never
        produces two ids (FR-007); the order asked is preserved.
        """
        if not names:
            return []
        resp = await self._request(
            "GET", f"/boards/{board_id}/labels", params={**self._auth, "fields": "id,name"}
        )
        by_name = {
            label.get("name"): label["id"] for label in resp.json() if label.get("name")
        }
        ids: list[str] = []
        for name in names:
            label_id = by_name.get(name)
            if label_id and label_id not in ids:
                ids.append(label_id)
        return ids

    async def find_label_id_by_name(self, board_id: str, name: str) -> str | None:
        """Single-name convenience over the batch read (kept for compatibility)."""
        ids = await self.find_label_ids_by_names(board_id, [name])
        return ids[0] if ids else None

    async def list_labels(self, board_id: str) -> list[dict[str, str]]:
        """Named labels of the board, with their Trello colour.

        Labels without a name are skipped: the user picks a label by its name (R7/FR-011).
        """
        resp = await self._request(
            "GET",
            f"/boards/{board_id}/labels",
            params={**self._auth, "fields": "id,name,color"},
        )
        return [
            {"name": label["name"], "color": label.get("color") or ""}
            for label in resp.json()
            if label.get("name")
        ]

    async def list_lists(self, board_id: str) -> list[dict[str, str]]:
        """Open lists of the board, in board order (FR-001/FR-009).

        The first item is the default destination of a card (R8).
        """
        resp = await self._request(
            "GET", f"/boards/{board_id}/lists", params={**self._auth, "filter": "open"}
        )
        return [{"id": item["id"], "name": item["name"]} for item in resp.json()]

    async def create_card(
        self,
        name: str,
        list_id: str,
        id_labels: list[str] | None = None,
        description: str | None = None,
        *,
        start: str | None = None,
        due: str | None = None,
    ) -> str:
        params: dict = {**self._auth, "name": name, "idList": list_id}
        if id_labels:
            params["idLabels"] = ",".join(id_labels)
        if description:
            params["desc"] = description
        if start:
            params["start"] = start
        if due:
            params["due"] = due
        resp = await self._request("POST", "/cards", params=params)
        return resp.json()["id"]

    async def list_custom_fields(self, board_id: str) -> list[dict]:
        """Custom fields of the board, with the options of the list-typed ones (013).

        The board listing already returns the name, type and (for list fields) the options inline,
        so a single read is enough. Note the separate GET /customFields/{id}/options endpoint returns
        the option id as `_id` (underscore), so we rely on the board listing's inline `options` which
        use `id`. Every access is defensive: a malformed field/option is skipped instead of raising —
        reading custom fields never blocks the capture (R9).
        """
        resp = await self._request("GET", f"/boards/{board_id}/customFields", params={**self._auth})
        fields: list[dict] = []
        for field in resp.json():
            field_id = field.get("id")
            if not field_id:
                continue
            name = field.get("name") or (field.get("display") or {}).get("name") or ""
            ftype = field.get("type") or ""
            options = [
                {
                    "id": option.get("id"),
                    "value": (option.get("value") or {}).get("text"),
                    "color": option.get("color"),
                }
                for option in (field.get("options") or [])
                if option.get("id")
            ]
            fields.append({"id": field_id, "name": name, "type": ftype, "options": options})
        return fields

    async def set_custom_field_item(self, card_id: str, field_id: str, payload: dict) -> None:
        """Set a custom field value on an existing card (the API has no such param on creation)."""
        await self._request(
            "PUT", f"/cards/{card_id}/customField/{field_id}/item", params={**self._auth}, json=payload
        )

    async def set_due_reminder(self, card_id: str, minutes: int) -> None:
        """Set the due reminder (minutes before due) on an existing card."""
        await self._request("PUT", f"/cards/{card_id}", params={**self._auth, "dueReminder": minutes})

    async def aclose(self) -> None:
        await self._client.aclose()
