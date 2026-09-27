"""Tests for the Trello client using httpx.MockTransport (no real API)."""
import asyncio

import httpx

from app.infrastructure.trello_client import TrelloClient


def _run(coro):
    return asyncio.run(coro)


def _make_client(handler, **kwargs) -> TrelloClient:
    return TrelloClient("key", "token", transport=httpx.MockTransport(handler), **kwargs)


def test_list_boards() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/1/members/me/boards"
        return httpx.Response(200, json=[{"id": "b1", "name": "Pessoal"}])

    client = _make_client(handler)
    try:
        boards = _run(client.list_boards())
    finally:
        _run(client.aclose())
    assert boards == [{"id": "b1", "name": "Pessoal"}]


def test_get_first_list_id() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json=[{"id": "list-1", "name": "A fazer"}, {"id": "list-2", "name": "Feito"}],
        )

    client = _make_client(handler)
    try:
        list_id = _run(client.get_first_list_id("b1"))
    finally:
        _run(client.aclose())
    assert list_id == "list-1"


def test_find_label_id_by_name() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[{"id": "label-1", "name": "Alta"}])

    client = _make_client(handler)
    try:
        label_id = _run(client.find_label_id_by_name("b1", "Alta"))
        missing = _run(client.find_label_id_by_name("b1", "Inexistente"))
    finally:
        _run(client.aclose())
    assert label_id == "label-1"
    assert missing is None


def test_find_label_ids_by_names_reads_the_board_once() -> None:
    """FR-002/SC-001: N names cost a single read of the board."""
    paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        paths.append(request.url.path)
        return httpx.Response(
            200,
            json=[{"id": "label-1", "name": "Alta"}, {"id": "label-2", "name": "Casa"}],
        )

    client = _make_client(handler)
    try:
        ids = _run(client.find_label_ids_by_names("b1", ["Alta", "Casa"]))
    finally:
        _run(client.aclose())
    assert ids == ["label-1", "label-2"]
    assert paths == ["/1/boards/b1/labels"]


def test_find_label_ids_by_names_skips_names_the_board_does_not_have() -> None:
    """R7 (amended by 010): missing names are skipped; repeats never duplicate an id."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[{"id": "label-2", "name": "Casa"}])

    client = _make_client(handler)
    try:
        ids = _run(client.find_label_ids_by_names("b1", ["Casa", "Sumiu", "Casa", ""]))
    finally:
        _run(client.aclose())
    assert ids == ["label-2"]


def test_find_label_ids_by_names_without_names_never_calls_trello() -> None:
    """P2: nothing to resolve means no request at all."""

    def handler(request: httpx.Request) -> httpx.Response:  # pragma: no cover
        raise AssertionError("Trello must not be called when there is nothing to resolve")

    client = _make_client(handler)
    try:
        ids = _run(client.find_label_ids_by_names("b1", []))
    finally:
        _run(client.aclose())
    assert ids == []


def test_create_card_with_label() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/1/cards"
        assert request.url.params["idLabels"] == "label-1"
        return httpx.Response(200, json={"id": "card-1"})

    client = _make_client(handler)
    try:
        card_id = _run(client.create_card("Comprar leite", "list-1", ["label-1"]))
    finally:
        _run(client.aclose())
    assert card_id == "card-1"


def test_create_card_sends_desc_when_present() -> None:
    captured: dict[str, str | None] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["desc"] = request.url.params.get("desc")
        return httpx.Response(200, json={"id": "card-1"})

    client = _make_client(handler)
    try:
        _run(client.create_card("T", "list-1", None, "linha 1\nlinha 2"))
    finally:
        _run(client.aclose())
    assert captured["desc"] == "linha 1\nlinha 2"


def test_create_card_omits_desc_when_absent() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert "desc" not in request.url.params
        return httpx.Response(200, json={"id": "card-1"})

    client = _make_client(handler)
    try:
        _run(client.create_card("T", "list-1"))
    finally:
        _run(client.aclose())


def test_retries_on_429() -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] < 3:
            return httpx.Response(429, json={})
        return httpx.Response(200, json=[{"id": "b1", "name": "Pessoal"}])

    client = _make_client(handler, backoff_base=0.0)
    try:
        boards = _run(client.list_boards())
    finally:
        _run(client.aclose())
    assert boards == [{"id": "b1", "name": "Pessoal"}]
    assert calls["n"] == 3


def test_list_labels_returns_named_labels_with_their_colour() -> None:
    """FR-001/FR-002/FR-011: named labels with colour; nameless ones are not offered."""

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/1/boards/b1/labels"
        assert request.url.params["fields"] == "id,name,color"
        return httpx.Response(
            200,
            json=[
                {"id": "l1", "name": "Casa", "color": "green"},
                {"id": "l2", "name": "", "color": "red"},
                {"id": "l3", "name": "Trabalho", "color": None},
            ],
        )

    client = _make_client(handler)
    try:
        labels = _run(client.list_labels("b1"))
    finally:
        _run(client.aclose())
    assert labels == [
        {"name": "Casa", "color": "green"},
        {"name": "Trabalho", "color": ""},
    ]


def test_list_lists_returns_open_lists_with_id_and_name() -> None:
    """FR-009: the lists come from the board, only the open ones, in board order."""

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/1/boards/b1/lists"
        assert request.url.params["filter"] == "open"
        return httpx.Response(
            200,
            json=[
                {"id": "l1", "name": "A fazer", "closed": False},
                {"id": "l2", "name": "Em andamento", "closed": False},
            ],
        )

    client = _make_client(handler)
    try:
        lists = _run(client.list_lists("b1"))
    finally:
        _run(client.aclose())
    assert lists == [
        {"id": "l1", "name": "A fazer"},
        {"id": "l2", "name": "Em andamento"},
    ]
