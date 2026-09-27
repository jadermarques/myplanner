# Contrato HTTP: etiqueta do card

**Feature**: `008-etiqueta-do-card` | **Date**: 2026-09-27

## GET /boards/{board_id}/labels (novo)

- **Autenticação**: obrigatória (R1/S1) — `401` sem sessão.
- **Resposta** `200`: lista das etiquetas **com nome** do board, sem as usadas como prioridade (R3),
  na ordem devolvida pelo Trello:

  ```json
  [{"name": "Casa", "color": "green"}, {"name": "Trabalho", "color": "orange_dark"}]
  ```

- `200 []` quando o board não tem etiquetas (ou só as de prioridade) — a interface simplesmente não
  mostra o item (FR-008).
- `502` quando o Trello falha (`{"detail": "erro ao listar etiquetas"}`).

## POST /cards (alterado)

- Body — campo **novo e opcional** em negrito:
  `{"title": "...", "board_id": "...", "priority": "..." | null, "description": "..." | null, `**`"label": "..." | null`**`}`
- `201 {"card_id": "..."}` — quando há etiqueta, o card é criado com o id dela em `idLabels`
  (junto com o da prioridade, se houver).
- `400` permanece **apenas** para: título vazio, prioridade inválida (R3) e descrição acima de 2.000
  caracteres (R6). **Etiqueta inválida/inexistente nunca gera 400** — R7: o card é criado sem ela.
- `401` sem sessão (inalterado).

## Payload enviado ao Trello

- `GET /1/boards/{id}/labels` com `fields=id,name,color` (novo uso; o mesmo endpoint já era usado pela
  resolução da prioridade).
- `POST /1/cards` com `idLabels` = ids **existentes** entre prioridade e etiqueta, sem repetição:
  - nenhum selecionado → parâmetro `idLabels` **não é enviado** (idêntico a hoje: SC-002);
  - prioridade apenas → como hoje;
  - etiqueta apenas → só ela;
  - os dois → os dois ids.

## Endpoints inalterados

- `GET /boards`, `GET /version`, `GET /health`, `POST /auth/*`, `GET /auth/status` — nenhuma mudança.

## Notas

- O nome da etiqueta é **dado do usuário**: nunca aparece em logs nem em mensagens de erro (S8).
- O frontend continua **sem** acesso ao Trello: tudo passa pelo BFF (R1/R2).
- A etiqueta existe **apenas na criação**: não há endpoint de edição de card.
