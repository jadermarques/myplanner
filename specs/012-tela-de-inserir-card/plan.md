# Implementation Plan: Ajustes na tela de inserir card (descrição e confirmação)

**Branch**: `012-tela-de-inserir-card` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-tela-de-inserir-card/spec.md`

## Summary

Duas mudanças **só de frontend** na tela de captura: (1) a descrição ganha um atalho com alvo grande e
ícone "+", e, quando aberta, botões **voltar** (recolhe preservando o texto) e **limpar** (zera) — com o
texto digitado virando um **resumo de 2 linhas** quando recolhida; (2) o **Salvar** passa a pedir
**confirmação sempre**, num modal da própria interface mostrando título e board.

## Technical Context

**Language/Version**: TypeScript/React 18 — **nenhuma dependência nova**

**Testing**: Vitest + RTL (unit) e Playwright em viewport de celular (E2E), mais a captura de tela
inspecionada antes de entregar

**Performance**: nada relevante — tudo local ao formulário

**Constraints**: preservar o comportamento pós-salvar; as validações atuais acontecem antes do diálogo;
nenhum card duplicado; a prioridade/etiquetas/lista não mudam nesta feature (013 assume depois)

**Scale/Scope**: 2 histórias; ~3 arquivos de frontend alterados + testes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra / Princípio | Resultado |
|-------------------|-----------|
| I (spec é o ativo principal) | ✅ spec 012 antes do código |
| II (specs pequenas) | ✅ 2 histórias, uma tela |
| III (test-first) | ✅ testes nascem das tasks (Red → Green) |
| IV (segurança por padrão) | ✅ nenhum endpoint novo, nenhum dado novo |
| V (proporcionalidade) | ✅ sem dependência nova; modal próprio em vez de biblioteca |
| VI (mobile-first) | ✅ alvos ≥48 px, resumo que não empurra o layout |
| VIII (rastreabilidade) | ✅ cada FR ligado a um teste |
| A6 (gatilhos de ADR) | ✅ **nenhum ADR** (sem banco, IA, usuário novo ou integração nova) |

*Re-check pós-Phase 1*: mantido ✅.

## Project Structure

```text
frontend/src/
├── components/CardForm.tsx        # descrição (3 estados) + modal de confirmação
├── App.tsx                        # passa o nome do board selecionado para o CardForm
└── styles/global.css              # .desc-open (atalho maior), .desc-summary (2 linhas), modal
frontend/tests/
├── unit/CardForm.test.tsx         # Red/Green: voltar/limpar/resumo + confirmar/cancelar
└── e2e/descricao-confirmacao.spec.ts
```

*(sem `research.md`, `data-model.md` nem `contracts/`: feature só de interface, sem API e sem modelo; as
decisões de design estão abaixo)*

## Design decisions

- **Resumo de 2 linhas** = clamp visual via CSS (`-webkit-line-clamp: 2`); o estado guarda o texto
  completo e é ele que viaja ao servidor (FR-004). O resumo é ele próprio o alvo de toque que reabre.
- **"voltar"** recolhe **sem** limpar; **"limpar"** zera o estado e recolhe (FR-003/FR-005).
- **Modal próprio** (não `window.confirm`): sobreposição no tema atual, com `role="dialog"`,
  `aria-modal="true"`, foco movido para dentro ao abrir e devolvido ao fechar (FR-011).
- **Validação primeiro**: o diálogo só abre depois de o título ser válido e a descrição estar dentro do
  limite — nada de confirmar o que falharia (FR-008).
- **Um envio, um diálogo**: durante o envio o botão já fica desabilitado (`saving`); o diálogo é aberto
  só uma vez por submissão (FR-009).
- **Nome do board no diálogo**: o `App` passa `boardName` (derivado do board selecionado) para o
  `CardForm` — hoje ele só recebe o id.

## Complexity Tracking

Nenhuma violação. Único ponto fora do trivial é o modal acessível — resolvido sem biblioteca, com foco
gerenciado no próprio componente (proporcional ao tamanho da feature).
