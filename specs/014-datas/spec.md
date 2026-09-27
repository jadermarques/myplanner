# Feature Specification: Datas e lembrete do card

**Feature Branch**: `014-datas`

**Created**: 2026-09-27

**Status**: Draft

**Input**: Itens **#3** (data de início), **#4** (data/hora de entrega) e **#5** (lembrete) da lista de
ajustes do dono. O research (D8 da 011 + `trello_inspect.py`) confirmou os campos `start`, `due` e
`dueReminder` no schema real do card.

## Clarifications

### Session 2026-09-27 — decidido com o dono

- **#3 (data de início)**: `start` = **a data/hora em que o card foi adicionado**, definido **no backend**
  (não aparece na tela).
- **#4 (data/hora de entrega)**: campo **`datetime-local`** logo **abaixo da Lista de destino**,
  **opcional** e **limpável**. Sem preencher → o card sai **sem** data de entrega. O usuário digita no
  **fuso do Brasil** e o backend converte para **UTC** ao enviar.
- **#5 (lembrete)**: aparece **dinamicamente** só quando há uma data de entrega. É um **checkbox "Definir
  lembrete"**; marcado, mostra os **offsets padrão do Trello** — **na hora da entrega · 5 min · 10 min ·
  15 min · 1 hora · 2 horas · 1 dia · 2 dias antes** — com **"na hora"** como pré-seleção. Sem data → sem
  lembrete.
- **`dueReminder`** é gravado **após criar o card** (a API não o expõe na criação), **best-effort**: se
  falhar, o card existe e o app avisa (mesma filosofia da 013/R7/R8).
- O lembrete é um **número em minutos** (`0` = na hora; `5`, `10`, `15`, `60`, `120`, `1440`, `2880`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Data de início automática (Priority: P1)

Como usuário único, quero que todo card criado registre **automaticamente** a data em que foi adicionado,
sem que eu precise fazer nada.

**Independent Test**: criar um card e conferir que o campo "start" (início) no Trello ficou com a data de
hoje.

**Acceptance Scenarios**:

1. **Given** qualquer card, **When** ele é criado, **Then** o `start` é a data/hora atual.
2. **Given** a tela de inserir card, **When** o usuário olha os campos, **Then** **não há** campo de
   "data de início" visível (é automático).

---

### User Story 2 - Data/hora de entrega opcional (Priority: P1)

Como usuário único, quero definir (ou não) uma **data/hora de entrega**, podendo limpá-la.

**Independent Test**: criar um card com data de entrega e conferir no Trello; criar outro sem e conferir
que não há data.

**Acceptance Scenarios**:

1. **Given** a tela, **When** o usuário abre, **Then** há um campo "Data de entrega" vazio abaixo da Lista
   de destino.
2. **Given** uma data preenchida, **When** o usuário salva, **Then** o card sai com essa data (em UTC).
3. **Given** uma data preenchida, **When** o usuário limpa, **Then** o campo volta a vazio.
4. **Given** o campo vazio, **When** o usuário salva, **Then** o card sai **sem** data de entrega.

---

### User Story 3 - Lembrete condicionado à data (Priority: P1)

Como usuário único, quero opcionalmente definir um **lembrete** quando há data de entrega.

**Independent Test**: marcar uma data + "Definir lembrete" e conferir o lembrete no Trello.

**Acceptance Scenarios**:

1. **Given** sem data de entrega, **When** o usuário olha a tela, **Then** **não há** o controle de
   lembrete.
2. **Given** uma data preenchida, **When** aparece o checkbox "Definir lembrete", **Then** ao marcar ele
   mostra os offsets com "na hora da entrega" pré-selecionado.
3. **Given** "Definir lembrete" desmarcado, **When** o usuário salva, **Then** o card sai **sem** lembrete.
4. **Given** um lembrete marcado, **When** o usuário limpa a data, **Then** o lembrete **some** junto.

### Edge Cases

- Data de entrega no passado: permitida (o Trello não impede) — decisão de não validar.
- Lembrete sem data (via manipulação): ignorado pelo servidor (não grava `dueReminder` sem `due`).
- Fuso: a conversão Brasil → UTC acontece no backend, sem depender do relógio do cliente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todo card criado DEVE receber **`start` = data/hora atual** (definido no backend).
- **FR-002**: DEVE existir um campo **"Data de entrega"** (`datetime-local`), vazio por padrão, **abaixo da
  Lista de destino**.
- **FR-003**: A data de entrega DEVE ser **opcional e limpável**; vazia → o card sai **sem** `due`.
- **FR-004**: A data digitada no **fuso do Brasil** DEVE ser convertida para **UTC** no backend.
- **FR-005**: O checkbox **"Definir lembrete"** DEVE aparecer **somente** quando há data de entrega.
- **FR-006**: O lembrete DEVE oferecer os offsets padrão do Trello (**na hora · 5 · 10 · 15 min · 1 h ·
  2 h · 1 dia · 2 dias antes**), com **"na hora"** pré-selecionado.
- **FR-007**: O lembrete DEVE ser gravado como **`dueReminder`** (minutos), **após criar o card**, em modo
  best-effort.
- **FR-008**: Sem data, o servidor DEVE **ignorar** `dueReminder` (nunca grava lembrete sem `due`).
- **FR-009**: Limpar a data DEVE **remover** o lembrete da tela (e do envio).

### Key Entities

- **Data de início (`start`)**: automática, registrada no card.
- **Data de entrega (`due`)**: opcional, definida pelo usuário.
- **Lembrete (`dueReminder`)**: minutos antes da entrega; condicionado à existência de `due`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Card criado tem `start` = hoje.
- **SC-002**: Card com data sai com `due` (UTC); sem data sai **sem** `due`.
- **SC-003**: Lembrete marcado sai com o `dueReminder` correto; desmarcado sai **sem**.
- **SC-004**: Sem data → **0** lembrete gravado.
- **SC-005**: **0** regressões nas suítes.

## Assumptions

- Não validar data no passado (o Trello não impede) — decisão de não bloquear.
- A tela usa o `datetime-local` nativo; a normalização fica no backend.

