# Contrato HTTP: mais de uma etiqueta por card

**Feature**: `010-multiplas-etiquetas` | **Date**: 2026-09-27

**Supera**: o contrato da feature `008-etiqueta-do-card` no que se refere ao campo `label` (passa a valer a
lista `labels`; `label` fica apenas como alias de transição).

## POST /cards (alterado)

- Body — campos de etiqueta em negrito:
  `{"title": "...", "board_id": "...", "priority": ... | null, "description": ... | null, `**`"labels": ["...", "..."] | null`**`, `**`"label": "..." | null`**` (antigo, alias), "list_id": ... | null}`
- Comportamento:
  - `labels` presente e não vazio → o card é criado com **todas** as etiquetas **válidas** (existentes no
    board), na ordem informada, **sem repetição** (R7 estendida).
  - `label` (antigo) também é aplicado, somado a `labels`, para um cliente em cache não perder etiqueta.
  - Nenhum dos dois, lista vazia ou só nomes inexistentes → card **sem etiqueta** (comportamento de hoje).
  - Nome inexistente em `labels` → **ignorado individualmente**; os válidos são aplicados; **nunca** gera 400.
- `201 {"card_id": "..."}` · `400` segue apenas para título vazio, prioridade inválida (R3) e descrição acima
  do limite (R6) · `401` sem sessão.

## Payload enviado ao Trello

- `POST /1/cards` com `idLabels` = ids **válidos e únicos** entre prioridade e etiquetas informadas:
  - nenhum → o parâmetro `idLabels` **não é enviado** (idêntico a hoje);
  - um ou vários → `idLabels` com a lista completa separada por vírgula (formato da API do Trello).
- `GET /1/boards/{id}/labels` é lido **uma única vez** por criação, independentemente de quantas etiquetas
  forem informadas (antes: uma leitura por etiqueta).

## Endpoints inalterados

- `GET /boards`, `GET /boards/{id}/labels`, `GET /boards/{id}/lists`, `GET /version`, `GET /health`,
  `POST /auth/*`, `GET /auth/status`.

## Notas

- Nomes de etiqueta são dados do usuário: nunca aparecem em logs nem em erros (S8).
- O alias `label` deve ser removido numa próxima versão (registrado como dívida consciente).
- A prioridade continua sendo **uma** escolha (R3) e a lista de destino segue validada contra o board (R8).
