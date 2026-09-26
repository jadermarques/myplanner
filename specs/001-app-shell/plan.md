# Implementation Plan: Base mínima do app (shell PWA)

**Branch**: `001-app-shell` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-app-shell/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Base mínima do MyPlanner funcionando de ponta a ponta no ambiente de desenvolvimento local: um PWA mobile-first (React + TypeScript + Vite) servindo uma tela inicial com um único ícone grande "Inserir card" (sem ação) e um rodapé com a versão (fonte única `VERSION`, lida via backend); um backend (Python 3.12 + FastAPI) expondo `GET /health` (público) e `GET /version` (público nesta feature — exceção temporária à S1). Sem internet/backend fora do ar, a tela informa claramente que precisa de conexão. Login, Trello e deploy estão fora de escopo.

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript / Node 22 (frontend)

**Primary Dependencies**: FastAPI, Uvicorn, pydantic-settings (backend); React, Vite, vite-plugin-pwa (frontend)

**Storage**: N/A — sem banco de dados nesta feature

**Testing**: pytest + TestClient (backend, unit/integração); Vitest + React Testing Library (frontend, unit); Playwright (E2E, viewport de celular)

**Target Platform**: navegador web móvel (PWA instalável) acessando a máquina de desenvolvimento via rede local

**Project Type**: aplicação web (frontend PWA + backend BFF)

**Performance Goals**: tela inicial em ≤ 3 s em rede local (SC-001); meta geral do produto (≤ 10 s p/ salvar card) pertence a feature futura

**Constraints**: mobile-first com alvos de toque grandes; sem funcionamento offline (apenas aviso); versão com fonte única no arquivo `VERSION` (regra O4); sem autenticação nesta feature; sem deploy (ambiente local)

**Scale/Scope**: usuário único; 3 histórias de usuário; 2 endpoints no backend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Resultado |
|-----------|-----------|
| I — Spec é o ativo principal | ✅ plan deriva da spec 001-app-shell |
| II — Specs pequenas e modulares | ✅ 3 histórias, preocupação única |
| III — Test-first inegociável | ✅ testes nascem das tasks; cobertura em domain/application quando essas camadas existirem |
| IV — Segurança por padrão | ✅ sem segredos; exceção S1 documentada (FR-006 + Clarifications) |
| V — Simplicidade e proporcionalidade | ⚠️ camadas api/application/domain/infrastructure adiadas (ver Complexidade) |
| VI — Mobile-first e velocidade | ✅ tela única, mobile-first; alvo ≤3 s |
| VII — Independência de fornecedor | ✅ nenhum hardcode de IA/modelo nesta feature |
| VIII — Rastreabilidade e versionamento | ✅ versão única em `VERSION` (O4) |
| IX — Limites da IA | ✅ sem chamadas externas nem produção |
| X — Idioma | ✅ artefatos pt-BR, código em inglês |

*Re-check pós-Phase 1*: mantido ✅ — nenhum artefato de design contradiz a constituição.

## Project Structure

### Documentation (this feature)

```text
specs/001-app-shell/
├── plan.md              # este arquivo (/speckit-plan)
├── research.md          # Phase 0 (/speckit-plan)
├── data-model.md        # Phase 1 (/speckit-plan)
├── quickstart.md        # Phase 1 (/speckit-plan)
├── contracts/
│   └── api.md           # contrato HTTP backend ↔ frontend (Phase 1)
├── checklists/
│   ├── requirements.md  # checklist built-in da spec
│   └── app-shell.md     # checklist custom (requirements quality)
└── tasks.md             # Phase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # app FastAPI + rotas GET /health e GET /version
│   ├── config.py        # configuração tipada (pydantic-settings: app.yaml + VERSION)
│   └── version.py       # leitura da fonte única de versão (arquivo VERSION)
├── requirements.in      # dependências diretas
├── requirements.txt     # gerado por pip-compile (com hashes)
└── tests/
    ├── __init__.py
    ├── test_health.py
    └── test_version.py

frontend/
├── index.html           # meta PWA (viewport, theme-color, manifest)
├── vite.config.ts       # Vite + vite-plugin-pwa
├── package.json
├── package-lock.json
├── public/
│   └── icons/           # ícones PWA (192, 512, maskable)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── HomeScreen.tsx     # ícone "Inserir card" + rodapé com versão
│   │   └── OfflineNotice.tsx  # aviso de offline/backend fora do ar
│   ├── hooks/
│   │   └── useOnlineStatus.ts # detecção de conectividade
│   ├── services/
│   │   └── api.ts             # chamadas a /health e /version
│   └── styles/
│       └── global.css
└── tests/
    ├── unit/
    └── e2e/
```

**Structure Decision**: Dois projetos (`backend/` e `frontend/`), conforme a topologia PWA → BFF de `docs/ARCHITECTURE.md`. O backend começa como módulo único (rotas + config + leitor de versão), sem as camadas `api → application → domain → infrastructure` — ver Complexidade.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Não introduzir as camadas `api → application → domain → infrastructure` (princípio V) | Esta feature tem 2 endpoints read-only, sem regra de negócio além da "versão de fonte única" e sem integração (Trello fora de escopo) | Camadas agora seriam "por precaução" (viola V/YAGNI); a separação entra quando a feature de inserir card trouxer regras (R3/R5) e o cliente Trello (infrastructure) |
