# Tasks: Aparelhos e TOTP

**Input**: Design documents from `/specs/004-dispositivos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídas por obrigatoriedade da constituição (princípio III — Test-first inegociável).

**Organization**: Tarefas agrupadas por história de usuário.

## Format: `[ID] [P?] [Story] Description`

- `[P]`: paralelizável (arquivos distintos, sem dependência)
- `[Story]`: história de usuário (US1, US2, US3)

## Path Conventions

- Backend: `backend/app/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`

## Phase 1: Setup

- [X] T001 Extend `backend/app/config.py` (+ `app_totp_secret`) e adicionar `pyotp` ao `backend/requirements.in` (recompilar)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: TOTP, storage de aparelhos e sessão vinculada ao aparelho.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase.

- [X] T002 [P] Write test `backend/tests/test_totp.py` (RED): código válido dentro de ±1 período; inválido fora
- [X] T003 Implement `backend/app/infrastructure/totp.py` (`pyotp`, `valid_window=1`)
- [X] T004 [P] Write test `backend/tests/test_device_store.py` (RED): criar/listar/remover aparelhos em arquivo gitignorado
- [X] T005 Implement `backend/app/domain/device.py` + `backend/app/infrastructure/device_store.py`
- [X] T006 [P] Write test `backend/tests/test_security_device.py` (RED): sessão com `device_id`; inválida se o aparelho for removido
- [X] T007 Modify `backend/app/infrastructure/security.py` (sessão inclui `device_id`) + `backend/app/api/middleware.py` (valida que o aparelho existe)

**Checkpoint**: TOTP + storage + sessão vinculada prontos.

---

## Phase 3: US1 (P1) — Registrar novo aparelho com TOTP 🎯 MVP

**Goal**: login exige TOTP quando o aparelho é novo; aparelho conhecido entra só com a senha.

- [X] T008 [P] [US1] Write test `backend/tests/test_devices_flow.py` (RED): login novo exige TOTP; TOTP válido registra; aparelho conhecido não exige
- [X] T009 [US1] Implement `backend/app/application/devices.py` (registrar) + ajustar `routes_auth.py` (`login` aceita `totp`; `/auth/status` expõe `device_registered`) + cookie `device_id` (`HttpOnly` + `SameSite=Strict`; `Secure` em produção)

---

## Phase 4: US2 (P2) — Listar aparelhos

- [X] T010 [P] [US2] Write test `GET /devices` (RED)
- [X] T011 [US2] Implement `backend/app/api/routes_devices.py` (`GET /devices`) e registrar em `backend/app/main.py`

---

## Phase 5: US3 (P3) — Revogar aparelho

- [X] T012 [P] [US3] Write test `POST /devices/{id}/revoke` (RED): aparelho some e sua sessão passa a `401`
- [X] T013 [US3] Implement revogação (use case + rota) e invalidar a sessão do aparelho

---

## Phase 6: Frontend

- [X] T014 [P] Extend `frontend/src/services/api.ts` (`login` com `totp`, `fetchDevices`, `revokeDevice`)
- [X] T015 [P] Write test `frontend/tests/unit/LoginScreen.test.tsx` + `frontend/tests/unit/DeviceList.test.tsx` (RED): campo TOTP quando o aparelho é novo; lista renderiza e dispara revogação
- [X] T016 Implement campo TOTP em `LoginScreen.tsx` + `frontend/src/components/DeviceList.tsx` + integrar no `App.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T017 [P] Write E2E `frontend/tests/e2e/devices.spec.ts` (Playwright): novo aparelho exige TOTP; lista mostra o aparelho
- [X] T018 Run `quickstart.md` validation ponta a ponta
- [X] T019 [P] Verify passwords/TOTP codes/secrets never appear in logs (S8) — teste/asserção

---

## Dependencies & Execution Order

- Setup (P1) → Foundational (P2) → US1 (P3) → US2 (P4) → US3 (P5) → Frontend (P6) → Polish (P7)
- Foundational BLOQUEIA todas as histórias.
- US1 (P1) é o MVP (TOTP em novo aparelho).

## Notes

- Testes primeiro (Red → Green) — constituição III.
- Sessão vinculada ao aparelho (ADR 0003); TOTP via `pyotp`; sem banco de dados.
- `[P]` = arquivos distintos, sem dependência.
- Alterar teste existente exige aprovação humana (regra de ouro).

## Phase 8: Convergence

> Resultado do `/speckit.converge` de 2026-09-25 (ver tabela de findings na sessão).
> Ordem: CRITICAL/HIGH primeiro. TDD continua obrigatório (constituição III).

- [X] T020 [P] Write test `backend/tests/test_devices_flow.py` (RED): registrar aparelho via `POST /auth/set-password` sem `totp` deve falhar; com `APP_TOTP_SECRET` vazio, falhar de forma controlada — per FR-001, SC-001, S4, spec Edge Case (contradicts)
- [X] T021 Exigir TOTP em `POST /auth/set-password` (`backend/app/api/routes_auth.py`) — ou deixar de registrar aparelho nesse fluxo — de modo que TODO registro de aparelho exija senha + TOTP válidos, removendo o "bootstrap sem TOTP" — per FR-001, SC-001, S4, data-model (contradicts)
- [X] T022 [P] Write test `backend/tests/test_routes_devices.py` (RED): após uso autenticado, `GET /devices` mostra `last_used_at` posterior ao `created_at` — per FR-004, US2/AC1, data-model (partial)
- [X] T023 Atualizar `last_used_at` a cada requisição autenticada de aparelho conhecido (chamar `DeviceStore.touch` em `backend/app/api/middleware.py` ou `routes_auth.py`) — per FR-004, US2/AC1, data-model (partial)
- [X] T024 [P] Write test `frontend/tests/unit/DeviceList.test.tsx` (RED) e exibir o último uso em `frontend/src/components/DeviceList.tsx` (formato pt-BR) — per US2/AC1 (partial)
- [X] T025 Definir `Secure` nos cookies de sessão, CSRF e aparelho (`routes_auth.py`, `middleware.py`), dirigido por configuração para não quebrar o acesso por HTTP em desenvolvimento — per FR-003, S3 (partial)
- [X] T026 [P] Alinhar a sessão com `data-model.md` (incluir `expires_at` no payload) ou documentar no data-model a derivação via `max_age` do itsdangerous — per data-model (partial)
- [X] T027 [P] Corrigir em `specs/004-dispositivos/plan.md` o caminho `api/security.py` → `infrastructure/security.py` — rastreabilidade (partial)

