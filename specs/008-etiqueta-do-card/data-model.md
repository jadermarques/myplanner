# Data Model: Etiqueta do card

**Feature**: `008-etiqueta-do-card` | **Date**: 2026-09-27

Sem banco de dados (MVP): este documento descreve as entidades em memória e o mapeamento para o Trello.

## Entidade: Card (alterada)

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| `title` | texto | sim | não vazio após `strip` (R: título obrigatório) |
| `board_id` | texto | sim | não vazio após `strip` |
| `priority` | texto \| nulo | não | precisa estar em `trello.priority_labels` (R3) |
| `description` | texto \| nulo | não | `strip`; vazio → nulo; máx. 2.000 caracteres (R6) |
| **`label`** | **texto \| nulo** | **não** | **`strip`; vazio → nulo; aplicado só se existir no board (R7)** |

Invariantes novos:

- **R7**: A etiqueta do card é **opcional** e só é aplicada se **existir no board** no momento da criação;
  caso contrário o card é criado **sem ela** (nunca gera erro). Etiquetas **sem nome** não são oferecidas.

## Entidade: Etiqueta (leitura)

| Campo | Tipo | Origem | Observação |
|-------|------|--------|------------|
| `name` | texto | `GET /1/boards/{id}/labels` | etiquetas sem nome são descartadas (FR-011) |
| `color` | texto | idem | nome da cor do Trello (ex.: `green`, `orange_dark`); a cor é decorativa |

**Lista oferecida ao usuário** = etiquetas do board **menos** os nomes de `trello.priority_labels` (R3),
preservando a ordem devolvida pelo Trello.

## Fluxo de dados

```text
Trello  --GET /1/boards/{id}/labels-->  TrelloClient.list_labels
                                             |
                                             v
                        application.list_labels (remove as de prioridade)
                                             |
                     GET /boards/{id}/labels  (autenticado)
                                             |
                                             v
                       frontend: useLabels(board) -> LabelSelect (chips, cor)

frontend: createCard(title, board_id, priority, description, label)
                                             |
                                             v
                     Card(label=...) -> valida (R3/R6) -> resolve id (R7)
                                             |
                        POST /1/cards  { idList, idLabels: [prioridade?, etiqueta?], desc? }
```

## Sem migração / sem persistência

- Nenhuma tabela, nenhum arquivo, nenhum `localStorage` novo: a lista é lida do Trello a cada troca de board
  e a escolha vive apenas no estado da tela (D9).
