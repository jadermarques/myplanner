# Implementation Plan: Lista de destino do card

**Branch**: `009-lista-de-destino` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-lista-de-destino/spec.md`

## Summary

Adicionar ao final do formulário de captura a escolha da **lista de destino** entre as listas abertas do
board, com a **primeira lista** como padrão. O servidor passa a aceitar `list_id` na criação e **valida que a
lista pertence ao board**; se não pertencer (ou não existir mais), o card é criado na primeira lista — nunca
em outro board e nunca com erro (nova invariante R8).

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript/React 18 (frontend)

**Primary Dependencies**: FastAPI, httpx, React/Vite — **nenhuma nova dependência**

**Storage**: nenhum (sem banco no MVP); as listas são lidas do Trello no momento do uso

**Testing**: pytest (domínio/aplicação/infra/rotas com Trello simulado) + Vitest/RTL + Playwright

**Target Platform**: PWA mobile-first; backend em Docker

**Project Type**: web (backend BFF + frontend)

**Performance Goals**: +1 requisição ao Trello por troca de board; o card simples continua ≤10 s e o padrão
custa 0 toques; **nenhuma requisição extra** no momento de salvar quando o campo não é tocado

**Constraints**: preservar a suíte atual (FR-010); nunca criar card em lista de outro board (SC-003);
nunca bloquear a captura por causa da lista (SC-004)

**Scale/Scope**: usuário único; 2 histórias; 1 arquivo novo no backend, 4 alterados; 2 novos no frontend,
4 alterados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra / Princípio | Resultado |
|-------------------|-----------|
| I (spec é o ativo principal) | ✅ spec 009 + decisões registradas antes do código |
| II (specs pequenas) | ✅ 2 histórias, escopo de um campo |
| III (test-first) | ✅ testes nascem das tasks (Red → Green) |
| IV (segurança por padrão) | ✅ endpoint autenticado; **validação de pertencimento** da lista (novo risco tratado) |
| V (proporcionalidade) | ✅ sem dependências novas; reusa o padrão de hook + endpoint das features 007/008 |
| VI (mobile-first e velocidade) | ✅ padrão correto com 0 toques; campo discreto, sem nova parede de chips |
| VIII (rastreabilidade) | ✅ nova R8 + testes que a referenciam; histórico por feature |
| A6 (gatilhos de ADR) | ✅ **nenhum ADR novo**: sem banco, sem IA, sem novo usuário, sem nova integração |

*Re-check pós-Phase 1*: mantido ✅.

## Project Structure

### Documentation (this feature)

```text
specs/009-lista-de-destino/
├── plan.md
├── research.md
├── data-model.md
├── contracts/api.md
├── quickstart.md
├── checklists/{requirements,lista}.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── application/
│   │   ├── create_card.py                 # aceita list_id e valida pertencimento (R8)
│   │   └── list_lists.py                  # NOVO: listas abertas do board
│   ├── infrastructure/trello_client.py    # + list_lists(board_id) e list_of_ids do board
│   └── api/routes.py                      # + GET /boards/{board_id}/lists ; POST /cards aceita list_id
└── tests/                                 # test_create_card, test_list_lists (novo), test_trello_client,
                                           # test_routes

frontend/
├── src/
│   ├── services/api.ts                    # BoardList, fetchLists, createCard(+listId)
│   ├── hooks/useLists.ts                  # NOVO: carrega por board, padrão = primeira lista
│   ├── components/ListSelect.tsx          # NOVO: seletor estilizado no fim do formulário
│   ├── components/CardForm.tsx            # integra o campo como último campo
│   ├── App.tsx                            # liga o hook ao board selecionado
│   └── styles/global.css                  # ajuste do controle de lista (nome longo)
└── tests/                                 # unit (ListSelect, useLists, CardForm) + e2e/lists.spec.ts
```

**Structure Decision**: mantém as camadas atuais. A validação "a lista pertence ao board" fica na **camada de
aplicação** (testável fora do transporte) e usa uma leitura do board no mesmo cliente do Trello — nada novo
de infraestrutura além de um método.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação a justificar. Observação registrada: `createCard` no frontend chega a 6 parâmetros
posicionais — mantidos por consistência com o restante do código; candidato a virar objeto de opções numa
limpeza futura (não nesta feature, por proporcionalidade).
