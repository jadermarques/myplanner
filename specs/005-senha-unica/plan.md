# Implementation Plan: Autenticação somente por senha

**Branch**: `005-senha-unica` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-senha-unica/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Remover o segundo fator (TOTP) e o gerenciamento de aparelhos introduzidos na 004, reduzindo o acesso a **somente a senha**. Escopo **subtrativo** — nenhuma capacidade nova. Saem o `pyotp`, o cookie e o estado de aparelho, as rotas `/devices`, a lista com revogação e o bloqueio progressivo por tentativas; volta a valer a sessão assinada stateless de 90 dias da 003, com cookie `HttpOnly`/`Secure`/`SameSite=Strict`. A decisão está no **ADR 0004**, que supera o ADR 0003 e revoga as regras S4 e S5.

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript / Node 22 (frontend)

**Primary Dependencies**: FastAPI, pydantic-settings, httpx, argon2-cffi, itsdangerous — **`pyotp` é removido**

**Storage**: arquivo do hash da senha (`backend/.data/password_hash`, gitignorado); sem banco de dados; o arquivo de aparelhos deixa de existir

**Testing**: pytest + TestClient (backend); Vitest + React Testing Library (frontend); Playwright (E2E)

**Target Platform**: navegador web móvel (PWA) + backend BFF

**Project Type**: aplicação web (frontend PWA + backend BFF)

**Performance Goals**: manter o fluxo de criar card ≤10 s (P1) — a mudança remove passos, não adiciona

**Constraints**: sem segundo fator e sem bloqueio por tentativas (decisão explícita — ADR 0004); sessões válidas no momento da mudança continuam válidas; nenhum vestígio na interface ou na documentação do produto

**Scale/Scope**: usuário único; 2 histórias; remoção de 4 módulos de backend, 1 router, 1 componente de frontend e 2 campos de formulário

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra | Resultado |
|-------|-----------|
| I (spec é o ativo principal) | ✅ spec 005 + ADR 0004 escritos antes do código |
| II (specs pequenas) | ✅ 2 histórias, escopo subtrativo |
| III (test-first) | ✅ testes nascem das tasks |
| V (proporcionalidade) | ✅ a remoção reduz código e estado |
| VIII (rastreabilidade) | ✅ ADR 0004; artefatos da 004 marcados como superados |
| S1 (auth em tudo, exceto `/health`) | ✅ inalterado |
| S2 (senha com hash Argon2id) | ✅ inalterado |
| S3 (sessão 90 d, cookie seguro) | ✅ mantida (volta a ser stateless) |
| S4 (TOTP por aparelho) | ⚠️ **revogada** pelo ADR 0004 (decisão explícita do dono) |
| S5 (bloqueio progressivo) | ⚠️ **revogada** por decisão do dono (clarificação de 2026-09-26) |
| S6 (CSRF + cabeçalhos de segurança) | ✅ inalterado |
| S7 (HTTPS obrigatório) | ✅ inalterado |
| S8 (sem segredos em logs) | ✅ inalterado |
| S9 (segredos só em `.env`) | ✅ inalterado (um segredo a menos) |

*Re-check pós-Phase 1*: mantido ✅.

## Project Structure

### Documentation (this feature)

```text
specs/005-senha-unica/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   ├── requirements.md
│   └── auth.md
└── tasks.md             # (/speckit-tasks — não criado aqui)
```

### Source Code (repository root)

```text
backend/app/
├── api/
│   ├── routes_auth.py        # login/set-password voltam a exigir só a senha
│   ├── middleware.py         # sai a checagem/atualização de aparelho
│   ├── routes_devices.py     # REMOVIDO
│   └── dependencies.py       # inalterado
├── application/
│   ├── auth.py               # inalterado
│   └── devices.py            # REMOVIDO
├── domain/
│   └── device.py             # REMOVIDO
├── infrastructure/
│   ├── security.py           # sessão volta a não ter device_id; LockoutTracker REMOVIDO
│   ├── device_store.py       # REMOVIDO
│   └── totp.py               # REMOVIDO
├── config.py                 # saem app_totp_secret e device_file (fica cookie_secure)
└── main.py                   # sai o router de /devices

frontend/src/
├── components/
│   ├── DeviceList.tsx        # REMOVIDO
│   ├── LoginScreen.tsx       # sai o campo de código
│   └── SetPasswordScreen.tsx # sai o campo de código
├── hooks/useAuth.ts          # sai device_registered
├── services/api.ts           # saem Device/fetchDevices/revokeDevice e o parâmetro totp
└── App.tsx                   # sai o botão "Aparelhos"
```

**Structure Decision**: mantém as camadas atuais; a mudança é de **remoção**, sem novo estado nem novas dependências.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| S4 e S5 revogadas (sem segundo fator e sem bloqueio por tentativas) | Decisão de produto do dono: um app pessoal de usuário único deve abrir com o mínimo de atrito; o custo operacional do TOTP por dispositivo não se pagou (ADR 0004) | Manter o segundo fator (opções 1 e 2 do ADR 0004) foi avaliado e rejeitado: exigia sincronizar o autenticador por dispositivo e manter um segredo como pré-requisito de instalação |
