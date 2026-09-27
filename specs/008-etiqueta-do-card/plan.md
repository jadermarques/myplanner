# Implementation Plan: Etiqueta do card

**Branch**: `008-etiqueta-do-card` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-etiqueta-do-card/spec.md`

## Summary

Adicionar o campo **etiqueta** ao card: um item de escolha direta (chips), igual à prioridade, alimentado
pelas **etiquetas reais do board** lidas do Trello por um novo endpoint autenticado. A escolha é única e
opcional, aplicada apenas na criação; a lista exclui as etiquetas usadas como prioridade; a captura nunca é
bloqueada por ausência ou falha das etiquetas.

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript/React 18 (frontend)

**Primary Dependencies**: FastAPI, httpx (já existentes) — **nenhuma nova dependência**

**Storage**: nenhum (MVP sem banco); leitura das etiquetas direto do Trello

**Testing**: pytest (domínio/aplicação/infra/rotas com Trello simulado) + Vitest/RTL + Playwright

**Target Platform**: PWA mobile-first; backend em Docker

**Project Type**: web (backend BFF + frontend)

**Performance Goals**: +1 requisição por troca de board (cacheada só em memória de sessão, sem persistência);
o card simples continua ≤10 s e a etiqueta custa no máximo 1 toque

**Constraints**: preservar a suíte atual (FR-014); a etiqueta nunca bloqueia a captura (FR-008);
o token do Trello segue só no servidor (R2); logs sem etiqueta (S8)

**Scale/Scope**: usuário único; 2 histórias; 2 arquivos de backend novos, 5 alterados, 3 de frontend novos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra / Princípio | Resultado |
|-------------------|-----------|
| I (spec é o ativo principal) | ✅ spec 008 + decisões registradas antes do código |
| II (specs pequenas) | ✅ 2 histórias, escopo de um campo opcional |
| III (test-first) | ✅ testes nascem das tasks, antes do código (Red → Green) |
| IV (segurança por padrão) | ✅ novo endpoint com `require_auth`; nenhum segredo novo |
| V (proporcionalidade) | ✅ sem dependências novas; reusa `find_label_id_by_name` e o padrão dos chips |
| VI (mobile-first e velocidade) | ✅ etiqueta em 1 toque, opcional, sem custo no caminho crítico |
| VIII (rastreabilidade) | ✅ nova regra R7 + teste que a referencia; histórico por feature |
| A6 (gatilhos de ADR) | ✅ **nenhum ADR novo**: sem banco, sem IA, sem novo usuário, sem nova integração externa |

*Re-check pós-Phase 1*: mantido ✅.

## Project Structure

### Documentation (this feature)

```text
specs/008-etiqueta-do-card/
├── plan.md
├── research.md
├── data-model.md
├── contracts/api.md
├── quickstart.md
├── checklists/{requirements,etiqueta}.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── domain/card.py                     # Card ganha `label` (opcional, normalizada)
│   ├── application/
│   │   ├── create_card.py                 # resolve a etiqueta e aplica (R7)
│   │   └── list_labels.py                 # NOVO: etiquetas do board menos as de prioridade
│   ├── infrastructure/trello_client.py    # + list_labels(board_id) (nome + cor)
│   └── api/routes.py                      # + GET /boards/{board_id}/labels; POST /cards aceita label
└── tests/                                 # test_card, test_create_card, test_list_labels (novo),
                                           # test_trello_client, test_routes

frontend/
├── src/
│   ├── services/api.ts                    # Label, fetchLabels, createCard(+label)
│   ├── hooks/useLabels.ts                 # NOVO: carrega por board e limpa ao trocar
│   ├── components/LabelSelect.tsx         # NOVO: chips com ponto de cor
│   ├── components/CardForm.tsx            # integra o item de etiqueta
│   ├── App.tsx                            # liga o hook ao board selecionado
│   └── styles/global.css                  # ponto de cor do chip + ajuste do texto longo
└── tests/                                 # unit (LabelSelect, useLabels, CardForm) + e2e/labels.spec.ts
```

**Structure Decision**: mantém as camadas atuais (api → application → domain → infrastructure no backend;
componentes + hooks + serviço no frontend). A exclusão das etiquetas de prioridade é **regra de aplicação**
(fica testável fora do transporte), e a leitura da cor entra no cliente do Trello.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação a justificar.
