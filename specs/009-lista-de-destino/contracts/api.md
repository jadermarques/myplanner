# Contrato HTTP: lista de destino do card

**Feature**: `009-lista-de-destino` | **Date**: 2026-09-27

## GET /boards/{board_id}/lists (novo)

- **Autenticação**: obrigatória (R1/S1) — `401` sem sessão.
- **Resposta** `200`: listas **abertas** do board, na ordem do Trello:

  ```json
  [{"id": "list-1", "name": "A fazer"}, {"id": "list-2", "name": "Em andamento"}]
  ```

- `200 []` quando o board não tem listas abertas — a interface não mostra o campo e o salvamento segue
  impedido pelo mesmo erro de hoje ("board has no open lists").
- `502` quando o Trello falha (`{"detail": "erro ao listar listas"}`).

## POST /cards (alterado)

- Body — campo **novo e opcional** em negrito:
  `{"title": "...", "board_id": "...", "priority": ... | null, "description": ... | null, "label": ... | null, `**`"list_id": "..." | null`**`}`
- `201 {"card_id": "..."}` — o card é criado na lista informada **quando ela pertence ao board**.
- **R8 / SC-003**: `list_id` ausente, `null`, vazio, de **outro board** ou de lista já apagada → o card é
  criado na **primeira lista aberta** do board. **Nunca gera 400** e nunca é criado fora do board.
- `400` permanece apenas para: título vazio, prioridade inválida (R3) e descrição acima do limite (R6).
- `401` sem sessão (inalterado).

## Payload enviado ao Trello

- `GET /1/boards/{id}/lists` com `filter=open` (o mesmo uso que já existia para descobrir a primeira lista;
  agora também devolvido à interface).
- `POST /1/cards` com `idList` = **a lista validada** (a escolhida, se pertence ao board; senão a primeira).
  `idLabels` e `desc` seguem exatamente as regras das features 006 e 008.

## Endpoints inalterados

- `GET /boards`, `GET /boards/{id}/labels`, `GET /version`, `GET /health`, `POST /auth/*`, `GET /auth/status`.

## Notas

- O `board_id` do corpo é a autoridade: é contra ele que a lista é validada (SC-003). Um cliente manipulado
  não consegue criar card em outro board.
- Nomes de lista são dados do usuário: **nunca** aparecem em logs nem em mensagens de erro (S8).
- O frontend continua sem acesso ao Trello: tudo passa pelo BFF (R1/R2).
