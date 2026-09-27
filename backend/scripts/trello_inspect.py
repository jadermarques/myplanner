"""Diagnóstico SOMENTE-LEITURA da API do Trello (ferramenta de desenvolvimento).

Por que existe: antes de implementar campos personalizados e datas (features 013/014) é preciso saber o
que a API devolve para **esta** conta — qual endpoint lista os campos personalizados de um board, os
tipos e valores definidos, e se há sinal de suporte a lembrete. É a verificação que evita escrever código
no escuro (a lição do certificado de IP: documentação não prova comportamento da conta real).

Garantias:
- faz **apenas GET** — nenhuma escrita, nenhum card criado, nada alterado no Trello;
- **nunca imprime** `TRELLO_API_KEY`/`TRELLO_TOKEN` (só o tamanho e os 4 primeiros caracteres, para você
  conferir que existem);
- não roda em CI, não é usado pelo app; pode ser apagado depois sem consequência.

Uso (na raiz do repositório):

    cd backend && .venv/bin/python scripts/trello_inspect.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from typing import Any

import httpx

# Permite rodar o script direto (backend/scripts/...) sem instalar pacote.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings  # noqa: E402  (import depois do sys.path, de propósito)

BASE_URL = "https://api.trello.com/1"
GET_COUNT = 0

# Preenchido em `_main()` a partir do .env (as credenciais nunca aparecem em saída ou log).
AUTH: dict[str, str] = {}


async def _get(client: httpx.AsyncClient, path: str, **params: Any) -> Any:
    global GET_COUNT
    GET_COUNT += 1
    resp = await client.get(path, params={**AUTH, **params})
    resp.raise_for_status()
    return resp.json()


async def _main() -> None:
    if not settings.trello_api_key or not settings.trello_token:
        print("erro: TRELLO_API_KEY/TRELLO_TOKEN não estão preenchidos no .env")
        return

    AUTH["key"] = settings.trello_api_key
    AUTH["token"] = settings.trello_token

    print("== credenciais ==")
    print(f"  key   = preenchida ({len(settings.trello_api_key)} caracteres)")
    print(f"  token = preenchido ({len(settings.trello_token)} caracteres)")

    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        boards = await _get(client, "/members/me/boards", fields="id,name")
        print(f"\n== boards ({len(boards)}) ==")
        for board in boards:
            print(f"  - {board['id']}  {board['name']}")

        for board in boards:
            print(f"\n== board: {board['name']} ({board['id']}) ==")

            # (a) campos personalizados do board — o endpoint que a feature 013 precisa
            try:
                fields = await _get(client, f"/boards/{board['id']}/customFields")
                print(f"  GET /boards/{{id}}/customFields -> OK ({len(fields)} campo(s))")
                for field in fields:
                    fid = field.get("id")
                    # A listagem por board já traz nome, tipo e (para listas) as opções inline com `id`.
                    # O endpoint separado /customFields/{id}/options devolve o id como `_id` (underscore) —
                    # por isso o app lê as opções do próprio board, não daquele endpoint.
                    try:
                        full = await _get(client, f"/customFields/{fid}")
                    except httpx.HTTPStatusError as exc:
                        print(
                            f"    · id={fid} tipo={field.get('type')!r}"
                            f"  (GET /customFields/{{id}} -> HTTP {exc.response.status_code})"
                        )
                        continue
                    display = full.get("display") or {}
                    name = display.get("name") or full.get("name")
                    ftype = full.get("type")
                    print(f"    · nome={name!r} tipo={ftype!r} id={fid}")
                    if ftype == "list":
                        try:
                            opts = await _get(client, f"/customFields/{fid}/options")
                        except httpx.HTTPStatusError as exc:
                            print(f"        (opções: HTTP {exc.response.status_code})")
                            opts = []
                        for option in opts:
                            value = (option.get("value") or {}).get("text")
                            print(f"        - opção: {value!r} cor={option.get('color')!r}")
            except httpx.HTTPStatusError as exc:
                print(f"  GET /boards/{{id}}/customFields -> FALHOU: HTTP {exc.response.status_code}")
                print(f"    (corpo: {exc.response.text[:200]})")

            # (b) pista sobre lembrete: o campo dueReminder existe na resposta do card?
            try:
                cards = await _get(
                    client,
                    f"/boards/{board['id']}/cards",
                    fields="id,name,due,dueReminder,start,dueComplete,idList",
                    limit=1,
                )
                if not cards:
                    print("  (board sem cards: não deu para sondar campos de data/lembrete)")
                    continue
                card = cards[0]
                print("  sondagem de datas/lembrete em 1 card:")
                for key in ("due", "dueReminder", "start", "dueComplete"):
                    presente = "presente" if key in card else "AUSENTE no schema"
                    print(f"    · {key}: {presente} (valor: {card.get(key)!r})")
            except httpx.HTTPStatusError as exc:
                print(f"  sondagem de datas -> FALHOU: HTTP {exc.response.status_code}")

        print(f"\n== resumo: {GET_COUNT} requisições GET, nenhuma escrita ==")


if __name__ == "__main__":
    asyncio.run(_main())
