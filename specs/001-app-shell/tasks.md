# Tasks: Base mínima do app (shell PWA)

**Input**: Design documents from `/specs/001-app-shell/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídas por obrigatoriedade da constituição (princípio III — Test-first inegociável): os testes nascem das tasks, antes do código (Red → Green).

**Organization**: Tarefas agrupadas por história de usuário (implementação/teste/entrega independentes).

## Format: `[ID] [P?] [Story] Description`

- `[P]`: paralelizável (arquivos distintos, sem dependência)
- `[Story]`: história de usuário (US1, US2, US3)

## Path Conventions

- Backend: `backend/app/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialização e estrutura base dos dois projetos.

- [X] T001 Create backend project structure: `backend/app/__init__.py`, `backend/tests/__init__.py`, and `backend/requirements.in` with `fastapi`, `uvicorn[standard]`, `pydantic-settings`
- [X] T002 [P] Create frontend project structure: `frontend/package.json`, `frontend/vite.config.ts` (with `vite-plugin-pwa` + dev proxy to backend), `frontend/index.html` (PWA meta), `frontend/tsconfig.json`, `frontend/src/main.tsx`, `frontend/src/styles/global.css`, `frontend/public/icons/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend API (`/health`, `/version`) + cliente HTTP do frontend — pré-requisito de todas as histórias.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase.

- [X] T003 [P] Write test `backend/tests/test_health.py` (RED): `GET /health` → 200 `{"status":"ok"}` conforme `contracts/api.md`
- [X] T004 [P] Write test `backend/tests/test_version.py` (RED): `GET /version` → `{"version":"<VERSION>"}`; quando `VERSION` ausente/vazio → `{"version":"unknown"}` conforme `contracts/api.md` e `data-model.md`
- [X] T005 Implement `backend/app/config.py`: configuração tipada (pydantic-settings) lendo `config/app.yaml` e resolvendo o caminho do arquivo `VERSION`
- [X] T006 Implement `backend/app/version.py`: lê o arquivo `VERSION`, retorna o conteúdo aparado; fallback `"unknown"` se ausente/vazio
- [X] T007 Implement `backend/app/main.py`: app FastAPI com `GET /health` e `GET /version`
- [X] T008 [P] Implement `frontend/src/services/api.ts`: `fetchVersion()` e `fetchHealth()` (base URL via proxy/env do Vite)

**Checkpoint**: backend + cliente HTTP prontos — histórias podem começar.

---

## Phase 3: User Story 1 — Tela inicial (Priority: P1) 🎯 MVP

**Goal**: Tela inicial com ícone "Inserir card" (sem ação) e rodapé com a versão (US1).

**Independent Test**: abrir o app no celular → ver ícone "Inserir card" e a versão no rodapé (igual a `VERSION`).

- [X] T009 [P] [US1] Write test `frontend/tests/unit/HomeScreen.test.tsx` (RED): renderiza "Inserir card" e a versão no rodapé
- [X] T010 [P] [US1] Implement `frontend/src/components/HomeScreen.tsx`: ícone grande "Inserir card" (sem ação) + rodapé com a versão
- [X] T011 [US1] Implement `frontend/src/App.tsx` (busca a versão no mount e renderiza HomeScreen) + `frontend/src/main.tsx` + `frontend/src/styles/global.css` (mobile-first, alvos de toque grandes)

---

## Phase 4: User Story 2 — Aviso offline (Priority: P2)

**Goal**: Sem internet/backend fora do ar, exibir aviso claro (US2).

**Independent Test**: modo avião → aviso "precisa de conexão"; reconectar → aviso some.

- [X] T012 [P] [US2] Write test `frontend/tests/unit/OfflineNotice.test.tsx` (RED): renderiza mensagem de que precisa de conexão
- [X] T013 [US2] Implement `frontend/src/hooks/useOnlineStatus.ts`: `navigator.onLine` + ping ao `/health` (`fetchHealth`)
- [X] T014 [US2] Implement `frontend/src/components/OfflineNotice.tsx`
- [X] T015 [US2] Integrar em `frontend/src/App.tsx`: exibir/ocultar OfflineNotice via `useOnlineStatus`

---

## Phase 5: User Story 3 — Instalação PWA (Priority: P3)

**Goal**: App instalável na tela inicial (US3).

**Independent Test**: "Adicionar à tela inicial" → abrir pelo ícone instalado → mesma tela.

- [X] T016 [US3] Implement manifest PWA no `vite.config.ts` (vite-plugin-pwa): name "MyPlanner", theme-color, `display: standalone`, start_url
- [X] T017 [P] [US3] Add PWA icons `frontend/public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`
- [X] T018 [US3] Configure service worker (registerType) + devOptions para testar instalação em dev

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T019 [P] Write E2E `frontend/tests/e2e/home.spec.ts` (Playwright, viewport móvel): home renderiza ícone + versão; mede o tempo até a versão aparecer (Performance API) e registra como métrica de SC-001
- [X] T020 [P] Write E2E `frontend/tests/e2e/offline.spec.ts` (Playwright): offline exibe aviso
- [X] T021 [P] Write E2E `frontend/tests/e2e/pwa.spec.ts` (Playwright): manifest referenciado + service worker registra
- [X] T022 Run `quickstart.md` validation ponta a ponta

---

## Dependencies & Execution Order

- Setup (P1) → Foundational (P2) → US1 (P3) → US2 (P4) → US3 (P5) → Polish (P6)
- Foundational BLOQUEIA todas as histórias.
- US1 (P1) é o MVP; US2 e US3 dependem de US1 (compartilham `App.tsx`/serviços), mas são testáveis independentemente.

## Implementation Strategy

1. MVP: Setup → Foundational → US1 → **validar** (tela inicial).
2. Incremental: +US2 (offline) → +US3 (PWA) → Polish (E2E + quickstart).

## Notes

- Testes primeiro (Red → Green) — constituição III.
- `[P]` = arquivos distintos, sem dependência.
- Commit após cada tarefa ou grupo lógico.
- Alterar teste existente exige aprovação humana (regra de ouro).
- Cobertura ≥80% aplicada ao pacote `backend/app` e aos componentes do frontend (TESTS_STRATEGY.md).
