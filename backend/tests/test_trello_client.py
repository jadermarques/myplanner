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
