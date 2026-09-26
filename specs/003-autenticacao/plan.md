# Implementation Plan: Autenticação do usuário único

**Branch**: `003-autenticacao` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-autenticacao/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Adicionar autenticação ao app: login por senha (Argon2id), sessão de 90 dias em cookie seguro (assinado, `HttpOnly`/`SameSite=Strict`), definir/trocar senha via UI, logout, bloqueio progressivo, e proteção de todos os endpoints (exceto `/health`) com CSRF + cabeçalhos de segurança. Sem banco de dados: sessão stateless (cookie assinado) e hash da senha em arquivo de estado gitignorado. TOTP e HTTPS ficam adiados (004 / deploy).

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript / Node 22 (frontend)

**Primary Dependencies**: FastAPI, Uvicorn, pydantic-settings, httpx (existentes) + `argon2-cffi` (hash de senha) + `itsdangerous` (sessão assinada)

**Storage**: arquivo de estado gitignorado (hash da senha + estado de bloqueio); sem banco de dados

**Testing**: pytest + TestClient (backend); Vitest + React Testing Library (frontend); Playwright (E2E)

**Target Platform**: navegador web móvel (PWA) + backend BFF

**Project Type**: aplicação web (frontend PWA + backend BFF)

**Performance Goals**: login ≤3 s (SC-001)

**Constraints**: senha Argon2id (S2); sessão 90 d em cookie `HttpOnly`/`Secure`/`SameSite=Strict` (S3); bloqueio progressivo 5→30 s (S5); CSRF + CSP/HSTS (S6); TOTP adiado (004)

**Scale/Scope**: usuário único; 6 histórias; endpoints `/auth/*` novos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra | Resultado |
|-------|-----------|
| S1 (auth em tudo exceto /health) | ✅ inclui `/version` |
| S2 (Argon2id) | ✅ `argon2-cffi` |
| S3 (sessão 90 d, cookie seguro) | ✅ cookie assinado `HttpOnly`/`SameSite=Strict` (`Secure` em produção) |
| S4 (TOTP ao registrar aparelho) | ⚠️ adiado para `004-dispositivos` (ver Complexidade) |
| S5 (bloqueio progressivo) | ✅ 5 falhas → 30 s dobrando |
| S6 (CSRF + cabeçalhos) | ✅ double-submit token + CSP/HSTS |
| S7 (HTTPS) | ⚠️ item de deploy, fora desta feature |
| S8 (sem segredos em logs) | ✅ |
| S9 (segredos só em .env) | ✅ `SESSION_SECRET` em `.env` |

*Re-check pós-Phase 1*: mantido ✅.

## Project Structure

### Documentation (this feature)

```text
specs/003-autenticacao/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   ├── requirements.md
│   └── authentication.md
└── tasks.md             # (/speckit-tasks — não criado aqui)
```

### Source Code (repository root)

```text
backend/app/
├── api/
│   ├── routes.py            # (existente) agora protegidas
│   ├── routes_auth.py       # /auth/login, /auth/logout, /auth/set-password, /auth/change-password, /auth/status
│   └── dependencies.py      # dependência de sessão (auth)
├── application/
│   └── auth.py              # casos de uso: login, definir/trocar senha, logout
├── domain/
│   └── password.py          # hash/verificação Argon2id + validação de força
├── infrastructure/
│   ├── security.py          # sessão assinada, CSRF, bloqueio, cabeçalhos
│   └── password_store.py    # leitura/escrita do hash (arquivo gitignorado)
├── config.py                # + SESSION_SECRET, APP_PASSWORD_HASH (opcional)
└── ...

frontend/src/
├── components/
│   ├── LoginScreen.tsx
│   ├── SetPasswordScreen.tsx
│   └── ChangePasswordScreen.tsx
├── hooks/
│   └── useAuth.ts
└── services/
    └── api.ts               # + login, logout, auth status, definir/trocar senha
```

**Structure Decision**: sessão **stateless** (cookie assinado) + hash em arquivo de estado gitignorado — sem banco de dados (proporcional para usuário único). Ver ADR 0002.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| S4 (TOTP) adiada | Implementação incremental: 003 = login base por senha; 004 = TOTP/dispositivos | Fazer tudo numa spec misturaria preocupações (viola II); senha-apenas é aceitável em ambiente local até a 004 |
