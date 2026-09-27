# Tasks: Autenticação somente por senha

**Input**: Design documents from `/specs/005-senha-unica/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: obrigatórios — constituição III (test-first). Todo código nasce depois do teste que falha.

**Organization**: agrupadas por história de usuário (US1, US2) e pela remoção da documentação.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1 (entrar só com a senha), US2 (nenhum vestígio de aparelhos)
- Caminhos exatos em cada tarefa

## Path Conventions

- Backend: `backend/app/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup

- [X] T001 Remover `pyotp` de `backend/requirements.in` e recompilar `backend/requirements.txt` com hashes (pip-tools)

---

## Phase 2: Foundational (remoção no backend)

**⚠️ CRITICAL**: nenhuma história pode ser validada antes disso.

- [X] T002 [P] Write/ajustar testes `backend/tests/test_routes_auth.py` (RED): `login`/`set-password` aceitam **só** a senha; tentativas repetidas de senha errada retornam `401` sempre (sem `429`); `GET /auth/status` **sem** `device_registered`
- [X] T003 Remover os módulos da funcionalidade retirada: `backend/app/infrastructure/totp.py`, `backend/app/domain/device.py`, `backend/app/infrastructure/device_store.py`, `backend/app/application/devices.py`, `backend/app/api/routes_devices.py`
- [X] T004 Remover de `backend/app/config.py` os campos `app_totp_secret` e `device_file` (manter `cookie_secure`)
- [X] T005 Remover o router de aparelhos de `backend/app/main.py`
- [X] T006 Simplificar `backend/app/api/routes_auth.py`: `set-password`/`login` exigem só a senha; `status` sem `device_registered`; remover TOTP, cookie de aparelho e o bloqueio por tentativas
- [X] T007 Simplificar `backend/app/api/middleware.py` e `backend/app/infrastructure/security.py`: sessão volta a não carregar `device_id`; remover a checagem/atualização de aparelho e o `LockoutTracker`
- [X] T008 Remover os testes da funcionalidade retirada (`test_totp.py`, `test_device_store.py`, `test_security_device.py`, `test_devices_flow.py`, `test_routes_devices.py`) e limpar o isolamento de aparelhos em `backend/tests/conftest.py`; **ajustar `backend/tests/test_security.py`** (remover `test_lockout_progressive` e o import de `LockoutTracker`, que deixam de existir — S5 revogada)

**Checkpoint**: backend compila, testes de auth passam, nenhuma referência a TOTP/aparelho

---

## Phase 3: US1 (P1) — Entrar informando apenas a senha 🎯 MVP

**Goal**: qualquer dispositivo entra com a senha, sem código nem configuração prévia.

**Independent Test**: definir senha no primeiro acesso e entrar de um dispositivo nunca usado informando somente a senha.

- [X] T009 [P] [US1] Ajustar testes de frontend `frontend/tests/unit/LoginScreen.test.tsx` (RED): sem campo de código; `login` chamado só com a senha
- [X] T010 [US1] Remover o campo de código de `frontend/src/components/SetPasswordScreen.tsx` e `frontend/src/components/LoginScreen.tsx`
- [X] T011 [US1] Remover o parâmetro `totp` de `login`/`setPassword` e o campo `device_registered` de `AuthStatus` em `frontend/src/services/api.ts`
- [X] T012 [P] [US1] Ajustar `frontend/tests/e2e/auth.spec.ts` e apagar `frontend/tests/unit/SetPasswordScreen.test.tsx` (o campo deixou de existir)

**Checkpoint**: primeiro acesso e login recorrente funcionam só com a senha

---

## Phase 4: US2 (P2) — Nenhum vestígio de aparelhos

**Goal**: nenhuma tela, campo ou menção a aparelhos/código/revogação.

**Independent Test**: percorrer todas as telas e não encontrar nada relacionado a aparelhos.

- [X] T013 [P] [US2] Write E2E `frontend/tests/e2e/auth.spec.ts` (RED): a tela de login **não** exibe campo de código
- [X] T014 [US2] Remover de `frontend/src/App.tsx` o botão "Aparelhos" e a renderização da lista; apagar `frontend/src/components/DeviceList.tsx`, `frontend/tests/unit/DeviceList.test.tsx` e `frontend/tests/e2e/devices.spec.ts`
- [X] T015 [US2] Remover de `frontend/src/services/api.ts` (`Device`, `fetchDevices`, `revokeDevice`) e de `frontend/src/hooks/useAuth.ts` o estado `deviceRegistered`
- [X] T016 [P] [US2] Remover de `frontend/src/styles/global.css` os estilos `.device-list` e `.device-info`

**Checkpoint**: nenhuma menção a aparelhos na interface

---

## Phase 5: Documentação e regras (S4/S5 revogadas)

- [X] T017 `docs/adr/0003-device-bound-session.md` recebe o aviso de superado pelo ADR 0004; `docs/adr/0004-password-only-auth.md` passa a "Aprovado"
- [X] T018 `docs/RULES.md`: revogar **S4** (TOTP por aparelho) e **S5** (bloqueio progressivo), mantendo S2/S3/S6/S7/S8/S9
- [X] T019 `docs/SECURITY.md`: atualizar a autenticação e o modelo de ameaças (sem segundo fator nem bloqueio; risco assumido)
- [X] T020 `AGENTS.md` A7/A8: remover `APP_TOTP_SECRET`, o TOTP, os aparelhos e o bloqueio progressivo
- [X] T021 `README.md` e `.env.example`: remover `APP_TOTP_SECRET` e a seção de segredos que o menciona
- [X] T022 `specs/004-dispositivos/spec.md`: marcar como superada pelo ADR 0004 / spec 005

---

## Phase 6: Polish & Cross-Cutting

- [X] T023 [P] Verificar que senha/segredo nunca aparecem em logs (S8) — teste/asserção
- [X] T024 Rodar `quickstart.md` ponta a ponta (inclui `GET /devices` → `404` e ausência de `429`)
- [X] T025 Rodar a suíte completa (pytest + vitest + Playwright) e conferir a contagem de testes

---

## Dependencies & Execution Order

- **Setup (T001)** → antes de tudo (dependências).
- **Foundational (T002–T008)** → bloqueia as histórias; T002 (testes) antes de T003–T008 (código).
- **US1 (T009–T012)** e **US2 (T013–T016)** → dependem do Foundational; US2 depende de US1 apenas para o E2E de login.
- **Documentação (T017–T022)** → pode rodar em paralelo com US1/US2 (arquivos distintos).
- **Polish (T023–T025)** → por último.

## Notes

- Testes primeiro (Red → Green) — constituição III.
- **Alterar/apagar testes existentes exige aprovação humana** (regra de ouro): os testes da 004
  são removidos junto com a funcionalidade; os da 003 voltam ao contrato somente-senha.
- Sem banco de dados; a mudança **reduz** estado e dependências.
- `[P]` = arquivos distintos, sem dependência.

---

## Phase 7: Remediações do `/speckit.analyze`

> Lacunas encontradas na análise de consistência (2026-09-26). **Ordem**: as tarefas de teste
> abaixo rodam junto com T002 (ainda em RED), **antes** de T003–T008.

- [X] T026 [P] Write test `backend/tests/test_security.py` (RED): uma sessão criada no **formato anterior** (payload contendo `device_id`) continua válida depois da mudança — per FR-007, research D1
- [X] T027 [P] Write test `backend/tests/test_routes_auth.py` (RED): um registro legado de dispositivo (cookie antigo) **não** influencia o acesso — nem concede, nem nega, nem condiciona — per FR-010
- [X] T028 [P] Write test `backend/tests/test_security.py` (RED): a sessão é renovada a cada uso, mantendo o prazo de 90 dias — per FR-005
- [X] T029 `docs/GLOSSARY.md`: remover o verbete **TOTP** (e qualquer menção a aparelho) — per FR-009


