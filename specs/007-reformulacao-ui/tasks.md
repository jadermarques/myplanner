# Tasks: Reformulação da interface (captura rápida)

**Input**: Design documents from `/specs/007-reformulacao-ui/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: obrigatórios — constituição III (test-first). Nenhuma asserção existente é removida;
as duas adaptações necessárias preservam a intenção original (research D10).

**Organization**: agrupadas por história de usuário (US1, US2, US3) + consistência das telas de auth.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1 (captura com menos toques), US2 (board visível, sem ruído), US3 (confirmação e próximo card)
- Caminhos exatos em cada tarefa

---

## Phase 1: Fundação visual (tokens, layout e contratos)

- [x] T001 [P] Write E2E `frontend/tests/e2e/ui.spec.ts` (RED): campo de título já focado ao abrir; prioridade marcada com 1 toque; alvos de toque ≥48 px; viewport 320×568 sem corte com a ação primária visível — per FR-001, FR-003, FR-004, SC-001, SC-002, SC-003, SC-004
- [x] T002 [P] Write test `frontend/tests/unit/PrioritySelect.test.tsx` ajustado (RED): as mesmas 6 opções, agora em grupo de rádio nomeado "Prioridade" (intenção preservada) — per FR-004, FR-010, SC-002
- [x] T003 `frontend/src/styles/global.css`: reescrever com tokens (tema escuro), layout em três faixas, áreas seguras, `:focus-visible`, estados de hover/active, `prefers-reduced-motion`, campos com 16 px — per FR-002, FR-003, FR-008, FR-011, FR-012, SC-003, SC-005
- [x] T004 `frontend/index.html`: `theme-color` coerente com o novo fundo e cor de base do documento — per FR-008, SC-005

**Checkpoint**: base visual pronta; os testes de ergonomia ainda falham (RED)

---

## Phase 2: US1 (P1) — Capturar com o mínimo de toques 🎯 MVP

**Goal**: abrir e digitar direto, prioridade em 1 toque, salvar sempre alcançável.

**Independent Test**: abrir o app autenticado e lançar um card sem nenhum toque preparatório.

- [x] T005 [US1] `frontend/src/App.tsx`: shell de três faixas (cabeçalho + conteúdo + barra de ação), preservando o `h1` "Inserir card" e o `<footer>` com a versão — per FR-002, FR-006, FR-008, SC-001
- [x] T006 [US1] `frontend/src/components/PrioritySelect.tsx`: virar grupo de rádio (chips) — todas as opções visíveis, **1 toque**, ≥48 px por alvo — per FR-004, SC-002
- [x] T007 [US1] `frontend/src/components/CardForm.tsx`: foco automático no título, chips de prioridade, descrição recolhida (006 preservada), ação "Salvar" sempre visível e alcançável — per FR-001, FR-002, SC-001
- [x] T008 [US1] `frontend/src/components/BoardSelect.tsx`: chip compacto do board atual (preservando `aria-label="Board"` e o picker nativo) — per FR-005, SC-001

**Checkpoint**: o fluxo do card simples exige 0 toques preparatórios e salva sem rolar

---

## Phase 3: US2 (P2) — Board visível e ações secundárias fora do caminho

**Independent Test**: ver o board atual sem tocar, trocá-lo em 1 toque e achar trocar senha/sair no menu.

- [x] T009 [US2] `frontend/src/App.tsx`: painel do menu "⋯" com **Trocar senha** e **Sair**; versão em `<footer>` discreto no fim do conteúdo (sem sobrepor) — per FR-005, FR-006, SC-001
- [x] T010 [US2] `frontend/src/components/OfflineNotice.tsx`: faixa que empurra o conteúdo, sem sobrepor nem cobrir controles (`role="alert"` preservado) — per FR-009

**Checkpoint**: nenhuma ação secundária compete com a captura

---

## Phase 4: US3 (P3) — Confirmação evidente e pronto para o próximo card

**Independent Test**: salvar e confirmar que a confirmação é óbvia e o título já aceita o próximo card.

- [x] T011 [US3] `frontend/src/components/CardForm.tsx`: faixa de sucesso (ícone via CSS, texto **exato** "Card criado!" no `role="status"`), limpeza completa e foco de volta no título — per FR-007, SC-001
- [x] T012 [P] [US3] Write test `frontend/tests/unit/CardForm.test.tsx` (RED): o sucesso devolve o foco ao campo de título — per FR-007, SC-001

**Checkpoint**: captura em série sem toques extras

---

## Phase 5: Consistência das telas de autenticação

- [x] T013 [P] `frontend/src/components/LoginScreen.tsx`, `SetPasswordScreen.tsx` e `ChangePasswordScreen.tsx`: mesma linguagem visual (título, subtítulo, campo, botão primário, mensagens), preservando todos os nomes acessíveis — per FR-010, FR-011

---

## Phase 6: Polish & Cross-Cutting

- [x] T014 [P] Ajustar `frontend/tests/e2e/home.spec.ts` (mesmos elementos e versão no `footer`) + asserção de alvo de toque mínimo no campo de título — per FR-003, SC-003, SC-006
- [x] T015 Rodar `quickstart.md` ponta a ponta (inclui 320×568 e modo avião) — per FR-009, SC-004
- [x] T016 Rodar a suíte completa (vitest + Playwright) + `npm run build` e conferir a contagem de testes — per FR-013, SC-006

---

## Dependencies & Execution Order

- **T003/T004** (fundação) antes de T005–T013.
- **US1 (T005–T008)**: T005 define o shell; T006–T008 são independentes entre si.
- **US2 (T009–T010)** e **US3 (T011–T012)** dependem de US1 (mesmos componentes).
- **Auth (T013)** em paralelo com US1–US3 (arquivos distintos).
- **Polish (T014–T016)** por último.

## Notes

- Testes primeiro (Red → Green) — constituição III.
- **Nenhuma asserção existente é removida ou enfraquecida**: as adaptações (prioridade e home)
  traduzem a mesma intenção para o novo controle e **acrescentam** verificações de ergonomia.
- Nenhuma mudança de API, regra, validação ou segurança (FR-013).
- Sem dependências novas; `[P]` = arquivos distintos, sem dependência.
