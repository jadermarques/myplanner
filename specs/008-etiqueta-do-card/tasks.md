# Tasks: Etiqueta do card

**Input**: Design documents from `/specs/008-etiqueta-do-card/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: obrigatórios — constituição III (test-first, Red → Green). Nenhum teste existente é removido;
as asserções atuais continuam válidas (SC-004).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1 (escolher etiqueta em 1 toque) · US2 (não atrapalhar quem não usa etiqueta)

---

## Phase 1: Testes primeiro (RED)

- [x] T001 [P] Write test `backend/tests/test_card.py`: campo `label` normalizado (`strip`, vazio → nulo) sem afetar título, prioridade e descrição — per FR-014, R7
- [x] T002 [P] Write test `backend/tests/test_trello_client.py`: `list_labels` devolve `{name, color}`, usa `fields=id,name,color` e descarta etiquetas sem nome — per FR-001, FR-002, FR-011, FR-013
- [x] T003 [P] Write test `backend/tests/test_list_labels.py` (novo): exclui as etiquetas de prioridade, preserva a ordem do Trello e devolve lista vazia quando só há prioridades — per FR-005, R3
- [x] T004 [P] Write test `backend/tests/test_create_card.py`: etiqueta resolvida e enviada; **sem** etiqueta o payload é idêntico ao de hoje; etiqueta inexistente → card criado **sem** ela — per FR-006, FR-010, R7
- [x] T005 [P] Write test `backend/tests/test_routes.py`: `GET /boards/{id}/labels` (200, 401 sem sessão, 502 quando o Trello falha) e `POST /cards` aceitando `label` — per FR-013, S1
- [x] T006 [P] [US1] Write test `frontend/tests/unit/LabelSelect.test.tsx` (novo): todas as etiquetas visíveis, "Sem etiqueta" inicial, escolha em **um** clique e cor exposta por opção — per FR-002, FR-003, FR-004
- [x] T007 [P] [US2] Write test `frontend/tests/unit/useLabels.test.ts` (novo): carrega pelo board, **limpa e recarrega** na troca de board e devolve lista vazia quando a busca falha — per FR-007, FR-008, SC-005
- [x] T008 [P] [US1] Write test `frontend/tests/unit/CardForm.test.tsx`: envia a etiqueta escolhida e mantém o payload de hoje quando não há etiqueta — per FR-006, FR-009, SC-002
- [x] T009 [P] [US1] Write e2e `frontend/tests/e2e/labels.spec.ts` (novo): um toque escolhe a etiqueta e o card sai com ela; board sem etiquetas → o item não aparece e o card ainda salva — per FR-001, FR-003, FR-008, SC-001, SC-003

**Checkpoint**: toda a suíte nova falha (RED) e a antiga continua verde

---

## Phase 2: Backend (GREEN)

- [x] T010 `backend/app/domain/card.py`: campo `label` opcional + normalização (`strip`; vazio → nulo) e docstring citando **R7** — per FR-006, FR-010, R7
- [x] T011 `backend/app/infrastructure/trello_client.py`: `list_labels(board_id)` com `fields=id,name,color`, devolvendo apenas etiquetas **com nome** — per FR-001, FR-002, FR-011
- [x] T012 `backend/app/application/list_labels.py` (novo): caso de uso que remove as etiquetas de prioridade (`trello.priority_labels`) preservando a ordem — per FR-005, R3
- [x] T013 `backend/app/application/create_card.py`: aceitar `label`, resolver o id e aplicar junto com a prioridade, sem repetir ids e **sem** falhar quando a etiqueta não existir — per FR-006, FR-010, R7
- [x] T014 `backend/app/api/routes.py`: `GET /boards/{board_id}/labels` autenticado (erro do Trello → 502) e `label` no corpo do `POST /cards` — per FR-013, S1

**Checkpoint**: backend verde; `GET /boards/{id}/labels` responde o contrato

---

## Phase 3: Frontend (GREEN)

- [x] T015 `frontend/src/services/api.ts`: tipo `Label {name, color}`, `fetchLabels(boardId)` e `createCard(..., label?)` enviando `label: label ?? null` — per FR-001, FR-006, FR-013
- [x] T016 `frontend/src/hooks/useLabels.ts` (novo): carrega as etiquetas do board, **limpa a escolha e recarrega** quando o board muda, e trata falha como lista vazia — per FR-007, FR-008
- [x] T017 `frontend/src/components/LabelSelect.tsx` (novo) + `frontend/src/styles/global.css`: chips com ponto de cor, "Sem etiqueta", nome longo sem quebrar o layout — per FR-002, FR-003, FR-004, FR-011, FR-012
- [x] T018 `frontend/src/components/CardForm.tsx` + `frontend/src/App.tsx`: integrar o item de etiqueta (renderizado **só** quando há etiquetas) e enviar a escolha ao criar o card — per FR-001, FR-006, FR-008, FR-009

**Checkpoint**: funcionalidade completa de ponta a ponta

---

## Phase 4: Documentação e fecho

- [x] T019 `docs/RULES.md` (nova **R7**) + `docs/GLOSSARY.md` (termo **Etiqueta**) — per R7, FR-010
- [x] T020 Rodar a suíte completa (pytest + vitest + Playwright) + `npm run build` e conferir contagens — per SC-004, FR-014
- [x] T021 Rodar o `quickstart.md` ponta a ponta (inclui board sem etiquetas e falha de rede) — per FR-008, SC-003

## Dependencies & Execution Order

- Fase 1 (testes) **antes** das fases 2 e 3 (constituição III).
- T010 → T011 → T012/T013 → T014 (backend, em cadeia); T005 depende de T011–T014 para passar.
- T015 → T016 → T017 → T018 (frontend, em cadeia).
- T019 em paralelo com as fases 2–3 (arquivos de docs).
- T020/T021 por último.

## Notes

- **Nada existente é enfraquecido**: o payload sem etiqueta deve continuar idêntico (SC-002) e os nomes
  acessíveis atuais permanecem (FR-014).
- A etiqueta é **opcional e não bloqueante** por decisão de projeto (D6) — é o que a R7 registra.
- Sem dependências novas, sem banco, sem novo segredo.
