# Data Model: Inserir card no Trello

**Feature**: `002-inserir-card` | **Date**: 2026-09-25

Sem persistência própria (sem banco de dados). O estado `last_used` vive no localStorage do frontend.

## Entidades

### Card
- **Descrição**: card a ser criado no Trello.
- **Atributos**:
  - `title`: string, obrigatório (não vazio / não só espaços).
  - `board_id`: string (id do board Trello), obrigatório.
  - `priority`: string (um dos labels de `trello.priority_labels`), opcional.
- **Regras/validação**:
  - `title` obrigatório (FR-002).
  - `priority` deve pertencer a `trello.priority_labels` (R3).
  - Sem `desc` (R4).

### Board
- **Descrição**: quadro do Trello de destino.
- **Atributos**: `id`, `name`.
- **Regras**: padrão `last_used` no localStorage (R5).

### Priority label
- **Descrição**: label de prioridade.
- **Atributos**: `name` (um de: Muito alta, Alta, Média, Baixa, Muito baixa).

## Transições de estado

- Formulário: `editando` → (valida título) → `salvando` → (sucesso) `confirmado` / (erro) `editando` com campos preservados.
