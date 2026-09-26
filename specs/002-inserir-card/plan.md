# Implementation Plan: Inserir card no Trello

**Branch**: `002-inserir-card` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-inserir-card/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Estender o app base com a funcionalidade central: criar um card no Trello em ≤10 s. O frontend ganha um formulário (título + seletor de board + seletor de prioridade); o backend ganha o cliente Trello e os endpoints `GET /boards` e `POST /cards`. Primeira integração externa → introduz as camadas `api → application → domain → infrastructure` e o ADR 0001.

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript / Node 22 (frontend)

**Primary Dependencies**: FastAPI, Uvicorn, pydantic-settings, httpx (backend); React, Vite, vite-plugin-pwa (frontend)

**Storage**: N/A — sem banco de dados; `last_used` no localStorage do frontend

**Testing**: pytest + httpx.MockTransport (backend, Trello simulado); Vitest + React Testing Library (frontend); Playwright (E2E)

**Target Platform**: navegador web móvel (PWA) + backend BFF na máquina de desenvolvimento

**Project Type**: aplicação web (frontend PWA + backend BFF)

**Performance Goals**: salvar um card simples em ≤10 s (SC-001/P1)

**Constraints**: token do Trello só no servidor (R2); rate limit <100 req/10 s com backoff em 429 (P2); prioridades limitadas a `trello.priority_labels` (R3); sem descrição (R4)

**Scale/Scope**: usuário único; 3 histórias; 2 endpoints novos no backend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra | Resultado |
|-------|-----------|
| R1 (só via API Trello) | ✅ frontend nunca chama o Trello |
| R2 (token só no servidor) | ✅ token lido de `.env`, nunca no frontend |
| R3 (prioridades) | ✅ validada contra `trello.priority_labels` |
| R4 (sem descrição) | ✅ `POST /cards` não envia `desc` |
| R5 (board last_used) | ✅ localStorage no frontend |
| P1 (≤10 s) | ✅ tela única, mínimo de chamadas |
| P2 (rate limit) | ✅ backoff exponencial em 429 |
| III (Test-first) | ✅ testes nascem das tasks |
| V (proporcionalidade) | ⚠️ camadas agora entram (justificado — ver Complexidade) |

*Re-check pós-Phase 1*: mantido ✅ — nenhum artefato de design contradiz a constituição.

## Project Structure

### Documentation (this feature)

```text
specs/002-inserir-card/
├── plan.md              # este arquivo (/speckit-plan)
├── research.md          # Phase 0 (/speckit-plan)
├── data-model.md        # Phase 1 (/speckit-plan)
├── quickstart.md        # Phase 1 (/speckit-plan)
├── contracts/
│   └── api.md           # contrato HTTP backend ↔ frontend (Phase 1)
├── checklists/
│   ├── requirements.md  # checklist built-in da spec
│   └── insert-card.md   # checklist custom (requirements quality)
└── tasks.md             # Phase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
backend/app/
├── api/
│   ├── __init__.py
│   └── routes.py            # GET /boards, POST /cards
├── application/
│   ├── __init__.py
│   └── create_card.py       # caso de uso: criar card (valida + chama Trello)
├── domain/
│   ├── __init__.py
│   └── card.py              # Card + validação de título/prioridade (R3/R4)
├── infrastructure/
│   ├── __init__.py
│   └── trello_client.py     # httpx + backoff 429
├── config.py                # (existente — estender com credenciais Trello + prioridades + rate limit)
├── version.py
└── main.py

frontend/src/
├── components/
│   ├── HomeScreen.tsx       # (existente)
│   ├── CardForm.tsx         # formulário: título + board + prioridade + Salvar
│   ├── BoardSelect.tsx      # seletor de board (padrão last_used)
│   └── PrioritySelect.tsx   # seletor de prioridade (labels configurados)
├── services/
│   └── api.ts               # + fetchBoards, createCard
└── hooks/
    └── useBoards.ts         # carrega boards + last_used
```

**Structure Decision**: introduzir as camadas `api → application → domain → infrastructure` no backend (agora justificadas pela primeira integração + regras de domínio R3/R5). Ver ADR 0001.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Introduzir camadas `api → application → domain → infrastructure` (princípio V) | Primeira integração externa (Trello) + regras de domínio (R3/R5) agora concretas | Camada única foi adequada até a base; com integração + regras, separar apresentação/caso-de-uso/domínio/infra evita acoplamento e permite testar o domínio isoladamente |
