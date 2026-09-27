# Tasks: Ajustes na tela de inserir card (descrição e confirmação)

**Input**: Design documents from `/specs/012-tela-de-inserir-card/`
**Prerequisites**: plan.md, spec.md

**Tests**: obrigatórios (TDD, AGENTS.md A10). Cada FR tocada tem ao menos um teste que a cita.

**Organization**: US1 (descrição) e US2 (confirmação), ambas P1.

## Phase 1: Setup

- [x] T001 Apontar `.specify/feature.json` para `specs/012-tela-de-inserir-card` e confirmar árvore limpa
  (ponto de restauração atual: `57c8643`).

## Phase 2: US1 — descrição com voltar/limpar/resumo

- [x] T002 [P] `frontend/tests/unit/CardForm.test.tsx`: **Red** — digitar → "voltar" → resumo visível e
  texto intacto ao reabrir; "limpar" → texto zerado e atalho restaurado; sem texto → sem resumo (FR-002/003/004/005).
- [x] T003 `frontend/src/components/CardForm.tsx` + `global.css`: **Green** — os três estados da
  descrição e os botões voltar/limpar com alvo ≥48 px.

## Phase 3: US2 — confirmar antes de salvar

- [x] T004 `frontend/tests/unit/CardForm.test.tsx`: **Red** — Salvar abre o diálogo (título + board) e
  **não** chama `createCard`; Cancelar não cria e preserva o formulário; Confirmar cria **uma** vez;
  título vazio mostra erro sem diálogo (FR-006/007/008/009).
- [x] T005 `frontend/src/components/CardForm.tsx` + `App.tsx` + `global.css`: **Green** — modal de
  confirmação (role=dialog, foco), passagem de `boardName` e fluxo confirmar/cancelar.

## Phase 4: E2E e convergência

- [x] T006 `frontend/tests/e2e/descricao-confirmacao.spec.ts`: **Red** → **Green** — fluxo completo no
  viewport de celular (abrir/voltar/limpar resumo; salvar → diálogo → confirmar → "Card criado!").
- [x] T007 Capturar a tela (Playwright) e **inspecionar a imagem**: resumo, modal e alvos visíveis.
- [x] T008 Convergir: `vitest` + `npx tsc --noEmit` (nos nossos arquivos) + `playwright` + build; depois
  o gancho de release (A9: VERSION + commit + tag + sugestão de push).

## Dependencies

- T003 depende de T002; T005 depende de T004; T006 depende de T003 e T005.
- US1 e US2 são independentes entre si (podem evoluir em paralelo, mas ambas mexem no `CardForm`).

## Parallel Example

```bash
# Red das duas histórias antes do Green (arquivo de teste em comum):
npm test -- --run tests/unit/CardForm.test.tsx
```

## Implementation Strategy

MVP = US1 + US2 juntas (é uma tela só, entrega pequena). Cada fase fecha com a suíte verde; a Phase 4
adiciona o E2E e a prova visual antes do release.
