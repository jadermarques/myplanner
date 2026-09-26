# Implementation Plan: Aparelhos e TOTP

**Branch**: `004-dispositivos` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-dispositivos/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Adicionar TOTP no registro de **novos aparelhos** (regra S4) e gerenciamento de aparelhos (lista + revogação). O login passa a exigir um código TOTP quando o aparelho é novo; a sessão passa a **referenciar o aparelho**, de modo que revogar um aparelho invalida sua sessão. Sem UI/QR (segredo fixo em `APP_TOTP_SECRET`) e sem banco de dados (aparelhos em arquivo de estado gitignorado).

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript / Node 22 (frontend)

**Primary Dependencies**: FastAPI, pydantic-settings, httpx, argon2-cffi, itsdangerous (existentes) + `pyotp` (TOTP)

**Storage**: arquivo de estado gitignorado (`backend/.data/devices.json`); sem banco de dados

**Testing**: pytest + TestClient (backend); Vitest + React Testing Library (frontend); Playwright (E2E)

**Target Platform**: navegador web móvel (PWA) + backend BFF

**Project Type**: aplicação web (frontend PWA + backend BFF)

**Performance Goals**: login com TOTP ≤3 s

**Constraints**: TOTP só em aparelho novo (S4); segredo em `.env` (S9); sem segredos em logs (S8); janela ±1 período

**Scale/Scope**: usuário único; 3 histórias; endpoints `/devices` novos + ajuste no login/sessão

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra | Resultado |
|-------|-----------|
| S4 (TOTP só em novo aparelho) | ✅ objetivo central da feature |
| S8 (sem segredos em logs) | ✅ |
| S9 (segredos só em .env) | ✅ `APP_TOTP_SECRET` em `.env` |
| S3 (sessão 90 d, cookie seguro) | ✅ sessão passa a referenciar o aparelho |
| V (proporcionalidade) | ✅ storage em arquivo (sem DB); sem UI/QR |
| III (Test-first) | ✅ testes nascem das tasks |

*Re-check pós-Phase 1*: mantido ✅.

## Project Structure

### Documentation (this feature)

```text
specs/004-dispositivos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   ├── requirements.md
│   └── devices.md
└── tasks.md             # (/speckit-tasks — não criado aqui)
```

### Source Code (repository root)

```text
backend/app/
├── domain/
│   └── device.py            # entidade Device
├── application/
│   └── devices.py           # registrar, listar, revogar aparelhos
├── infrastructure/
│   ├── device_store.py      # CRUD de aparelhos (arquivo gitignorado)
│   └── totp.py              # wrapper pyotp (valid_window=1)
├── api/
│   ├── routes_devices.py    # GET /devices, POST /devices/{id}/revoke
│   ├── routes_auth.py       # login passa a aceitar `totp`
│   └── security.py          # sessão passa a incluir device_id
├── config.py                # + APP_TOTP_SECRET

frontend/src/
├── components/
│   ├── LoginScreen.tsx      # + campo TOTP quando o aparelho é novo
│   └── DeviceList.tsx       # lista + revogar
└── services/api.ts          # + devices, revogar
```

**Structure Decision**: reaproveita as camadas da 003; aparelhos em arquivo de estado gitignorado (sem DB) — proporcional. Ver ADR 0003.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Sessão passa a referenciar o aparelho (estado extra) | Sem isso, revogar um aparelho não invalidaria a sessão dele (FR-006) | Sessão puramente stateless (003) não permite revogação por aparelho; incluir `device_id` + checagem é o mínimo |
