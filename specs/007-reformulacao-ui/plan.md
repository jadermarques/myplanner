# Implementation Plan: Reformulação da interface (captura rápida)

**Branch**: `007-reformulacao-ui` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-reformulacao-ui/spec.md`

## Summary

Reformular a interface do PWA para **capturar cards com o mínimo de toques**: cabeçalho compacto
(identidade + board atual + menu secundário), formulário em coluna com **título já focado**,
prioridade em **chips** (1 toque), descrição opcional recolhida (006 preservada) e **barra de ação
fixa** sempre alcançável pelo polegar. Tema escuro com tokens de design, áreas seguras tratadas,
alvos de toque ≥48 px e confirmação de sucesso evidente com recomeço imediato. **Apenas
apresentação/interação**: nenhuma mudança de API, regra, validação ou segurança.

## Technical Context

**Language/Version**: TypeScript / React 18 + Vite (PWA) — **somente frontend**

**Primary Dependencies**: as existentes (React, Vite, vite-plugin-pwa) — **nenhuma nova**

**Storage**: nenhum; o estado é local à tela (o board continua lembrado em `localStorage`, como hoje)

**Testing**: Vitest + React Testing Library (unidade), Playwright em viewport de celular (E2E)

**Target Platform**: navegador móvel (PWA instalável); tema escuro único

**Project Type**: frontend do PWA (o backend não é tocado)

**Performance Goals**: manter o card simples em ≤10 s, agora com **0 toques preparatórios**

**Constraints**: preservar os nomes acessíveis e papéis usados nos testes (FR-010); alvos ≥48 px e
≥8 px de separação; contraste ≥4.5:1; `prefers-reduced-motion`; áreas seguras (`viewport-fit=cover`)

**Scale/Scope**: usuário único; 3 histórias; 8 componentes de apresentação, 1 folha de estilos
(reescrita), 2 testes de unidade ajustados (prioridade e E2E de home) + 1 novo E2E de ergonomia

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra / Princípio | Resultado |
|-------------------|-----------|
| I (spec é o ativo principal) | ✅ spec 007 + decisões registradas antes do código |
| II (specs pequenas) | ✅ 3 histórias, escopo de apresentação |
| III (test-first) | ✅ testes nascem das tasks; ajustes preservam a intenção das asserções |
| IV (segurança por padrão) | ✅ nenhum contrato de segurança/API alterado (FR-013) |
| V (proporcionalidade) | ✅ sem dependências novas; sem camadas novas; CSS com tokens |
| VI (mobile-first e velocidade) | ✅ princípio central: menos toques, ação na zona do polegar |
| VIII (rastreabilidade) | ✅ histórico do Spec Kit mantido; feature 006 preservada |
| FR-010 (contrato de teste) | ✅ nomes acessíveis preservados de propósito |

*Re-check pós-Phase 1*: mantido ✅.

## Project Structure

### Documentation (this feature)

```text
specs/007-reformulacao-ui/
├── plan.md
├── research.md
├── quickstart.md
├── checklists/
│   ├── requirements.md
│   └── ui.md
└── tasks.md             # (/speckit-tasks — não criado aqui)
```

*(sem `data-model.md` e sem `contracts/`: a feature não introduz dados nem muda a API — FR-013)*

### Source Code (repository root)

```text
frontend/
├── index.html                 # theme-color, viewport-fit, cor de fundo do sistema
├── src/
│   ├── App.tsx                # shell: cabeçalho + conteúdo + barra de ação; menu secundário
│   ├── components/
│   │   ├── CardForm.tsx       # título com foco, chips de prioridade, descrição recolhida, salvar
│   │   ├── PrioritySelect.tsx # passa a ser um grupo de botões de escolha direta
│   │   ├── BoardSelect.tsx    # vira um "chip" compacto do board atual
│   │   ├── OfflineNotice.tsx  # faixa que empurra o conteúdo (sem sobrepor)
│   │   ├── LoginScreen.tsx    # mesma linguagem visual
│   │   ├── SetPasswordScreen.tsx
│   │   └── ChangePasswordScreen.tsx
│   └── styles/global.css      # reescrita: tokens, layout, estados, áreas seguras
└── tests/
    ├── unit/PrioritySelect.test.tsx   # asserções traduzidas para o novo controle (mesma intenção)
    ├── e2e/home.spec.ts               # versão continua num <footer>; + alvos de toque
    └── e2e/ui.spec.ts                 # novo: 0 toques preparatórios, 1 toque na prioridade, 320×568
```

**Structure Decision**: mantém a arquitetura atual (componentes de apresentação + um serviço de API);
a mudança é visual e de interação, sem estado novo e sem dependências — proporcional.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação a justificar.
