# Implementation Plan: Descrição do card

**Branch**: `006-descricao-do-card` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-descricao-do-card/spec.md`

## Summary

Adicionar uma descrição **opcional** ao card, informada na tela única atrás de um campo
**recolhido** ("adicionar descrição"), limitada a **2.000 caracteres** com contador visível.
O texto viaja até o campo `desc` do card no Trello, sem cortes nem alteração de quebras de linha.
O card simples (título + prioridade) permanece idêntico — **0 campos obrigatórios novos**.
A regra **R4** do `docs/RULES.md` ("não há campo descrição") é **revogada** por esta feature.

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript / Node 22 (frontend)

**Primary Dependencies**: as existentes — **nenhuma dependência nova** (FastAPI, httpx, React)

**Storage**: sem persistência nova; nenhum banco de dados

**Testing**: pytest + TestClient (backend); Vitest + React Testing Library (frontend); Playwright (E2E)

**Target Platform**: navegador web móvel (PWA) + backend BFF

**Project Type**: aplicação web (frontend PWA + backend BFF)

**Performance Goals**: manter o card simples em ≤10 s (P1) — o campo não entra no caminho do fluxo simples

**Constraints**: limite de 2.000 caracteres (spec/FR-005); texto simples, sem formatação nem pré-visualização; R3 mantida; R4 revogada; nada de descrição em logs (S8)

**Scale/Scope**: usuário único; 2 histórias; 1 campo novo ponta a ponta (~6 arquivos + testes)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra / Princípio | Resultado |
|-------------------|-----------|
| I (spec é o ativo principal) | ✅ spec 006 + clarificações antes do código |
| II (specs pequenas) | ✅ 2 histórias, um campo, uma funcionalidade |
| III (test-first) | ✅ testes nascem das tasks |
| IV (segurança por padrão) | ✅ nada novo exposto; a descrição é conteúdo do usuário e **nunca** vai para logs (S8) |
| V (proporcionalidade) | ✅ sem dependências novas, sem camadas novas, sem banco |
| VI (mobile-first e velocidade) | ✅ campo recolhido: o fluxo do card simples não muda |
| VIII (rastreabilidade) | ✅ R4 revogada com registro em `docs/RULES.md` |
| R3 (prioridades limitadas) | ✅ inalterada |
| R4 (sem campo descrição) | ⚠️ **revogada** por esta feature |
| P1 (salvar em ≤10 s) | ✅ 0 campos obrigatórios novos |

*Re-check pós-Phase 1*: mantido ✅.

## Project Structure

### Documentation (this feature)

```text
specs/006-descricao-do-card/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   ├── requirements.md
│   └── descricao.md
└── tasks.md             # (/speckit-tasks — não criado aqui)
```

### Source Code (repository root)

```text
backend/app/
├── domain/
│   └── card.py                # + `description` e a regra do limite (revoga R4 do docstring)
├── application/
│   └── create_card.py         # + parâmetro `description`
├── infrastructure/
│   └── trello_client.py       # `create_card(..., description)` → envia `desc` só quando há texto
└── api/
    └── routes.py              # CreateCardRequest + `description` (validação do limite)

frontend/src/
├── components/
│   └── CardForm.tsx           # gatilho "adicionar descrição" + textarea + contador
├── services/api.ts            # `createCard(..., description?)`
└── styles/global.css          # estilos do gatilho, do campo e do contador

docs/
└── RULES.md                   # R4 revogada (mantendo R1–R3 e R5)
```

**Structure Decision**: reaproveita integralmente as camadas existentes; a mudança é um campo
opcional atravessando api → application → domain → infrastructure, sem estado novo — proporcional.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| R4 revogada (o card passa a ter descrição) | Decisão de produto do dono: o contexto do card precisa nascer com ele, em vez de ser completado depois no app do Trello (spec 006) | Manter a ausência de descrição foi a decisão anterior (R4, feature 002); o dono a revogou nesta feature, com o campo **opcional e recolhido** para não custar velocidade |
