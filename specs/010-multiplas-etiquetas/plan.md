# Implementation Plan: Mais de uma etiqueta por card

**Branch**: `010-multiplas-etiquetas` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-multiplas-etiquetas/spec.md`

## Summary

Trocar a etiqueta única por uma **coleção**: os chips passam a ligar/desligar, o card aceita `labels` (lista)
e o servidor aplica **todas** as etiquetas válidas. A resolução de nomes para ids passa a ser feita em **uma
única leitura** do board (antes era uma por etiqueta), e uma etiqueta inexistente é ignorada individualmente
(R7 estendida) em vez de derrubar a seleção.

## Technical Context

**Language/Version**: Python 3.12 + TypeScript/React 18 — **nenhuma dependência nova**

**Testing**: pytest (Trello simulado) + Vitest/RTL + Playwright

**Performance Goals**: criar card com N etiquetas custa **1** requisição de leitura de labels (antes N);
o custo por etiqueta na interface continua 1 toque

**Constraints**: preservar R3 (prioridade única) e R8 (lista validada); sem etiqueta o resultado é idêntico
ao de hoje; aceitar o campo antigo `label` como alias (FR-012)

**Scale/Scope**: usuário único; 2 histórias; 4 arquivos de backend e 5 de frontend alterados, 0 novos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra / Princípio | Resultado |
|-------------------|-----------|
| I (spec é o ativo principal) | ✅ spec 010 antes do código; FR-003 da 008 marcada como superada |
| II (specs pequenas) | ✅ 2 histórias, escopo de um campo |
| III (test-first) | ✅ testes nascem das tasks (Red → Green) |
| IV (segurança por padrão) | ✅ nenhum endpoint novo; mesma validação de pertencimento (R7/R8) |
| V (proporcionalidade) | ✅ sem dependências novas; reusa chips, hooks e contratos |
| VI (mobile-first e velocidade) | ✅ 1 toque por etiqueta; "limpar" evita 5 toques |
| VIII (rastreabilidade) | ✅ R7 estendida + testes que a referenciam |
| A6 (gatilhos de ADR) | ✅ **nenhum ADR novo** (sem banco, IA, usuário novo ou integração nova) |

*Re-check pós-Phase 1*: mantido ✅.

## Project Structure

```text
backend/
├── app/
│   ├── domain/card.py                  # labels: tuple[str, ...] (strip, sem vazios, sem repetição)
│   ├── application/create_card.py      # resolve todos os nomes em 1 leitura do board (R7 estendida)
│   ├── infrastructure/trello_client.py # + find_label_ids_by_names (o método antigo passa a delegar)
│   └── api/routes.py                   # `labels: list[str] | None` + alias `label`
└── tests/                              # test_card, test_create_card, test_trello_client, test_routes

frontend/
├── src/
│   ├── services/api.ts                 # createCard(..., labels?: string[])
│   ├── hooks/useLabels.ts              # selectedLabels: string[] + toggleLabel + clearLabels
│   ├── components/LabelSelect.tsx      # chips com caixas de seleção (ligar/desligar)
│   ├── components/CardForm.tsx         # envia a lista + ação "limpar"
│   └── styles/global.css               # ação "limpar" ao lado do rótulo
└── tests/                              # unit (LabelSelect, useLabels, CardForm) + e2e/labels.spec.ts
```

*(sem `data-model.md` e sem `contracts/` novos: o modelo e o contrato são alterações dos documentos da 008,
registrados aqui e no `contracts/api.md` desta feature)*

## Complexity Tracking

Nenhuma violação a justificar. Risco assumido: o campo antigo `label` (alias de transição) sai numa próxima
versão — registrado no contrato.
