# Contrato HTTP: descrição do card

**Feature**: `006-descricao-do-card` | **Date**: 2026-09-26

## POST /cards (alterado)

- Body — campo **novo e opcional** em negrito:
  `{"title": "...", "board_id": "...", "priority": "..." | null, `**`"description": "..." | null`**`}`
- `201 {"card_id": "..."}` — quando há descrição, o card é criado com o campo `desc` preenchido.
- `400` título vazio, prioridade inválida (R3) ou **descrição acima de 2.000 caracteres**.
- Comportamento **inalterado** quando `description` vem ausente, `null`, vazia ou só com
  espaços/quebras: o card é criado **sem** o parâmetro `desc`.
- `401` sem sessão (inalterado).

## Payload enviado ao Trello

- **Com** descrição: `POST /1/cards` incluindo `desc=<texto normalizado>`.
- **Sem** descrição: exatamente como hoje — o parâmetro `desc` não é enviado.

## Endpoints inalterados

- `GET /boards`, `GET /version`, `GET /health`, `/auth/*` — nenhuma mudança.

## Notas

- A descrição **nunca** aparece em logs nem em mensagens de erro (S8); os erros citam apenas o
  limite, nunca o conteúdo.
- O limite de 2.000 caracteres é validado no servidor (autoridade). A interface sinaliza pelo
  contador, mas o servidor recusa mesmo que a interface falhe.
- A descrição existe **apenas na criação**: não há endpoint de edição de card.
