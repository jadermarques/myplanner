# Contrato HTTP: backend ↔ frontend

**Feature**: `002-inserir-card` | **Date**: 2026-09-25

Base URL: `http://<dev-machine>:8000` (via proxy `/api` no Vite). Endpoints públicos nesta fase (login fora de escopo).

## GET /boards

Lista os boards do usuário (do Trello).

- **200 OK**:
  ```json
  [ { "id": "5f...", "name": "Pessoal" }, { "id": "5g...", "name": "Trabalho" } ]
  ```
- **401** quando o token é inválido/revogado.

## POST /cards

Cria um card no Trello (na primeira lista aberta do board).

- **Request body**:
  ```json
  { "title": "Comprar leite", "board_id": "5f...", "priority": "Alta" }
  ```
  (`priority` é opcional.)
- **201 Created**:
  ```json
  { "card_id": "5h..." }
  ```
- **400** quando `title` está vazio/só espaços.
- **401** token inválido.
- **429** rate limit (o backend já aplica backoff; se persistir, retorna erro).
- **502** erro inesperado da API do Trello.

## Notas

- O backend é quem chama o Trello (R1); o frontend só fala com estes endpoints.
- O token do Trello nunca aparece nestas respostas (R2).
