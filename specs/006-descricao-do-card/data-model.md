# Data Model: Descrição do card

**Feature**: `006-descricao-do-card` | **Date**: 2026-09-26

Sem banco de dados e sem persistência nova: a descrição existe em memória durante a requisição
e é gravada no card do Trello. Nada é guardado do lado do app.

## Entidades

### Card (estendida)

- **Descrição**: um card a criar passa a ter, além de título, board e prioridade opcional, uma
  **descrição opcional** (texto livre).
- **Atributos**:
  - `title`: obrigatório (vazio ou só espaços → recusado) — **inalterado**.
  - `board_id`: obrigatório — **inalterado**.
  - `priority`: opcional, restrita a `trello.priority_labels` (R3) — **inalterado**.
  - `description`: **opcional**; até **2.000 caracteres** após normalização.
- **Regras**:
  - Descrição só com espaços/quebras de linha → tratada como **ausente**.
  - Descrição acima de 2.000 caracteres → **recusada** com mensagem clara (nunca truncada).
  - O conteúdo é preservado exatamente como digitado (acentos, emojis, quebras de linha).
  - `title` continua obrigatório: a descrição **não** o substitui.

### Descrição (valor)

- Não é uma entidade persistida: é um valor que acompanha o card na criação e resulta no campo
  `desc` do card no Trello.

## Transições de estado

- `recolhida` → (abrir o campo) → `visível e vazia` → (digitar) → `pronta`.
- `pronta` → (salvar) → `card criado com descrição` → formulário limpo e campo **recolhido**.
- `pronta` → (falha ao salvar) → texto **preservado** no formulário, pronto para nova tentativa.
- `acima do limite` → (reduzir o texto) → `pronta` (o salvamento volta a ficar habilitado).
