# Tasks: Autenticação do usuário único

**Input**: Design documents from `/specs/003-autenticacao/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídas por obrigatoriedade da constituição (princípio III — Test-first inegociável): testes nascem das tasks, antes do código (Red → Green).

**Organization**: Tarefas agrupadas por história de usuário.

## Format: `[ID] [P?] [Story] Description`

- `[P]`: paralelizável (arquivos distintos, sem dependência)
- `[Story]`: história de usuário (US1…US6)

## Path Conventions

- Backend: `backend/app/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`

## Phase 1: Setup

- [X] T001 Extend `backend/app/config.py` (+ `session_secret`, `app_password_hash` opcional) e adicionar `argon2-cffi` + `itsdangerous` ao `backend/requirements.in` (recompilar)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Primitivas de segurança do backend (senha, sessão, CSRF, bloqueio, storage). Pré-requisito de todas as histórias.

**⚠️ CRITICAL**: Nenhuma história começa antes desta fase.

- [X] T002 [P] Write test `backend/tests/test_password.py` (RED): hash/verify Argon2id; validação de força (tamanho mínimo)
- [X] T003 [P] Implement `backend/app/domain/password.py` (hash/verify + força)
- [X] T004 [P] Write test `backend/tests/test_security.py` (RED): sessão assinada (sign/verify), CSRF, bloqueio progressivo 5→30s
- [X] T005 Implement `backend/app/infrastructure/security.py` (sessão `itsdangerous` com renovação sliding de 90 d a cada requisição autenticada, CSRF, bloqueio, cabeçalhos)
- [X] T006 [P] Write test `backend/tests/test_password_store.py` (RED): ler/gravar hash em arquivo gitignorado
- [X] T007 Implement `backend/app/infrastructure/password_store.py`

**Checkpoint**: primitivas de segurança prontas.

---

## Phase 3: User Story 1 & 2 — Definir senha + Login (Priority: P1) 🎯 MVP

**Goal**: definir senha no primeiro acesso e logar (US1 + US2).

**Independent Test**: sem senha → tela "definir senha" → definir → autenticado; depois logar com a senha.

- [X] T008 [P] [US1] Write test `backend/tests/test_auth_use_case.py` (RED): set_password (primeiro acesso) e login (senha certa/errada)
- [X] T009 [US1] Implement `backend/app/application/auth.py` (set_password, login)
- [X] T010 [P] [US2] Write test `backend/tests/test_routes_auth.py` (RED): `GET /auth/status`, `POST /auth/set-password`, `POST /auth/login`
- [X] T011 [US2] Implement `backend/app/api/routes_auth.py` e registrar em `backend/app/main.py`

---

## Phase 4: User Story 3 & 4 — Trocar senha + Logout (Priority: P2)

**Goal**: trocar a senha e sair (US3 + US4).

- [X] T012 [P] [US3] Write test trocar senha + logout (RED)
- [X] T013 [US3] Implement `change_password` (use case) + `POST /auth/change-password` e `POST /auth/logout`

---

## Phase 5: User Story 5 — Bloqueio progressivo (Priority: P3)

**Goal**: bloquear após 5 falhas (30 s dobrando) (US5).

- [X] T014 [P] [US5] Write test bloqueio progressivo no login (RED)
- [X] T015 [US5] Implementar bloqueio no `login` (5→30 s)

---

## Phase 6: User Story 6 — Proteção dos endpoints (Priority: P4)

**Goal**: exigir sessão em tudo, exceto `/health` (US6).

- [X] T016 [P] [US6] Write test endpoints protegidos → 401 sem sessão (RED)
- [X] T017 [US6] Implement `backend/app/api/dependencies.py` (dependência de sessão) e aplicar em `/boards`, `/cards`, `/version` + CSRF + cabeçalhos

---

## Phase 7: Frontend — fluxo de autenticação

- [X] T018 [P] Extend `frontend/src/services/api.ts` (login, logout, auth status, definir/trocar senha, header CSRF)
- [X] T019 [P] Write test `frontend/tests/unit/LoginScreen.test.tsx` (RED)
- [X] T020 [P] Implement `frontend/src/hooks/useAuth.ts` + `frontend/src/components/LoginScreen.tsx` + `SetPasswordScreen.tsx` + `ChangePasswordScreen.tsx`
- [X] T021 [US6] Integrar em `frontend/src/App.tsx`: rotina "definir senha → login → app", botão "Sair"

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T022 [P] Write E2E `frontend/tests/e2e/auth.spec.ts` (Playwright): definir senha + login + acesso ao app (API mockada); mede o tempo do login (métrica de SC-001)
- [X] T023 Run `quickstart.md` validation ponta a ponta
- [X] T024 [P] Verify passwords/cookies never appear in logs (S8) — teste/asserção

---

## Dependencies & Execution Order

- Setup (P1) → Foundational (P2) → US1/2 (P3) → US3/4 (P4) → US5 (P5) → US6 (P6) → Frontend (P7) → Polish (P8)
- Foundational BLOQUEIA todas as histórias.
- US1+US2 (P1) são o MVP (definir senha + login).

## Notes

- Testes primeiro (Red → Green) — constituição III.
- Sessão stateless + hash em arquivo (ADR 0002); TOTP/HTTPS adiados.
- `[P]` = arquivos distintos, sem dependência.
- Alterar teste existente exige aprovação humana (regra de ouro).
