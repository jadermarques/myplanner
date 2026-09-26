# Tasks: Inserir card no Trello

**Input**: Design documents from `/specs/002-inserir-card/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídas por obrigatoriedade da constituição (princípio III — Test-first inegociável): os testes nascem das tasks, antes do código (Red → Green).

**Organization**: Tarefas agrupadas por história de usuário (implementação/teste/entrega independentes).

## Format: `[ID] [P?] [Story] Description`

- `[P]`: paralelizável (arquivos distintos, sem dependência)
- `[Story]`: história de usuário (US1, US2, US3)

## Path Conventions

- Backend: `backend/app/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`

## Phase 1: Setup

**Purpose**: Configuração do Trello (credenciais + parâmetros).

- [X] T001 Extend `backend/app/config.py`: add `trello_api_key` e `trello_token` (do `.env`) e `priority_labels` + `rate_limit` (de `config/app.yaml`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Camadas de domínio, cliente Trello, caso de uso e rotas — pré-requisito de todas as histórias.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase.

- [X] T002 [P] Write test `backend/tests/test_card.py` (RED): título obrigatório (vazio/só espaços rejeitado); prioridade deve pertencer a `priority_labels`
- [X] T003 [P] Implement `backend/app/domain/card.py`: entidade `Card` + validação (título, prioridade)
- [X] T004 [P] Write test `backend/tests/test_trello_client.py` (RED, `httpx.MockTransport`): listar boards; achar label por nome; criar card na primeira lista aberta; backoff em 429
- [X] T005 Implement `backend/app/infrastructure/trello_client.py`: cliente `httpx` assíncrono + backoff exponencial em 429
- [X] T006 Implement `backend/app/application/create_card.py`: caso de uso (validar card + criar no Trello + aplicar label por nome)
- [X] T007 [P] Write test `backend/tests/test_routes.py` (RED): `GET /boards` e `POST /cards` com cliente Trello simulado
- [X] T008 Implement `backend/app/api/routes.py` (`GET /boards`, `POST /cards`) e registrar o router em `backend/app/main.py`

**Checkpoint**: backend pronto — histórias podem começar.

---

## Phase 3: User Story 1 — Salvar um card (Priority: P1) 🎯 MVP

**Goal**: Formulário (título + board + prioridade) que salva um card no Trello (US1).

**Independent Test**: criar um card pelo app e ver que aparece no Trello (primeira lista do board).

- [X] T009 [P] [US1] Write test `frontend/tests/unit/CardForm.test.tsx` (RED): renderiza campos; valida título vazio; chama salvar
- [X] T010 [P] [US1] Extend `frontend/src/services/api.ts`: `fetchBoards()` e `createCard(title, board_id, priority?)`
- [X] T011 [US1] Implement `frontend/src/components/CardForm.tsx`: campo título + Salvar + mensagem de sucesso/erro (campos preservados)
- [X] T012 [US1] Integrate `CardForm` into `frontend/src/App.tsx` + estilos em `frontend/src/styles/global.css`

---

## Phase 4: User Story 2 — Escolher o board (Priority: P2)

**Goal**: Seletor de board com padrão `last_used` (US2).

**Independent Test**: abrir o app → seletor lista os boards; reabrir → board anterior pré-selecionado.

- [X] T013 [P] [US2] Write test `frontend/tests/unit/useBoards.test.ts` (RED): carrega boards; usa `last_used` do localStorage como padrão
- [X] T014 [US2] Implement `frontend/src/hooks/useBoards.ts`: busca boards + persistência `last_used` no localStorage
- [X] T015 [US2] Implement `frontend/src/components/BoardSelect.tsx` e integrar ao `CardForm`

---

## Phase 5: User Story 3 — Escolher a prioridade (Priority: P3)

**Goal**: Seletor de prioridade com os labels configurados (US3).

**Independent Test**: abrir o seletor → lista apenas `priority_labels`.

- [X] T016 [P] [US3] Write test `frontend/tests/unit/PrioritySelect.test.tsx` (RED): lista apenas `priority_labels`
- [X] T017 [US3] Implement `frontend/src/components/PrioritySelect.tsx` e integrar ao `CardForm`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T018 [P] Write E2E `frontend/tests/e2e/create-card.spec.ts` (Playwright): formulário renderiza; título vazio mostra erro (API mockada); mede o tempo até a confirmação (Performance API) como métrica de SC-001
- [X] T019 Run `quickstart.md` validation ponta a ponta (requer `.env` com credenciais)
- [X] T020 [P] Verify `TRELLO_TOKEN`/`TRELLO_API_KEY` do not appear in the frontend build output (`frontend/dist`) — SC-003 (grep/inspeção)

---

## Dependencies & Execution Order

- Setup (P1) → Foundational (P2) → US1 (P3) → US2 (P4) → US3 (P5) → Polish (P6)
- Foundational BLOQUEIA todas as histórias.
- US1 (P1) é o MVP; US2 e US3 refinam o formulário (seletor de board/prioridade).

## Implementation Strategy

1. MVP: Setup → Foundational → US1 → **validar** (salvar card).
2. Incremental: +US2 (board/last_used) → +US3 (prioridade) → Polish (E2E + quickstart).

## Notes

- Testes primeiro (Red → Green) — constituição III.
- O cliente Trello é testado com `MockTransport` (nunca chama a API real nos testes) — ADR 0001.
- `[P]` = arquivos distintos, sem dependência.
- Alterar teste existente exige aprovação humana (regra de ouro).
