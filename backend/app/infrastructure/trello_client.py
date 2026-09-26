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

    async def _request(self, method: str, url: str, *, params: dict | None = None) -> httpx.Response:
        delay = self._backoff_base
        for attempt in range(self._max_retries):
            resp = await self._client.request(method, url, params=params)
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

    async def find_label_id_by_name(self, board_id: str, name: str) -> str | None:
        resp = await self._request("GET", f"/boards/{board_id}/labels", params={**self._auth, "fields": "id,name"})
        for label in resp.json():
            if label.get("name") == name:
                return label["id"]
        return None

    async def create_card(self, name: str, list_id: str, id_labels: list[str] | None = None) -> str:
        params: dict = {**self._auth, "name": name, "idList": list_id}
        if id_labels:
            params["idLabels"] = ",".join(id_labels)
        resp = await self._request("POST", "/cards", params=params)
        return resp.json()["id"]

    async def aclose(self) -> None:
        await self._client.aclose()
