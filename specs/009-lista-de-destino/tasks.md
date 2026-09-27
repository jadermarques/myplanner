# Tasks: Lista de destino do card

**Input**: Design documents from `/specs/009-lista-de-destino/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: obrigatórios — constituição III (test-first, Red → Green). Nenhum teste existente é removido.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1 (escolher a lista) · US2 (não piorar quem não escolhe)

---

## Phase 1: Testes primeiro (RED)

- [x] T001 [P] Write test `backend/tests/test_card.py`: campo `list_id` normalizado (`strip`, vazio → nulo) sem afetar as demais invariantes — per FR-010, R8
- [x] T002 [P] Write test `backend/tests/test_list_lists.py` (novo): devolve as listas abertas na ordem do board e lista vazia quando não há nenhuma — per FR-001, FR-002
- [x] T003 [P] Write test `backend/tests/test_trello_client.py`: `list_lists` usa `filter=open` e devolve `{id, name}` — per FR-009
- [x] T004 [P] Write test `backend/tests/test_create_card.py`: lista válida é usada; lista de **outro board**, lista **apagada**, ausente e vazia → **primeira lista**; sem lista, o payload é idêntico ao de hoje — per FR-005, FR-006, SC-002, SC-003, R8
- [x] T005 [P] Write test `backend/tests/test_routes.py`: `GET /boards/{id}/lists` (200, 401 sem sessão, 502 quando o Trello falha) e `POST /cards` com `list_id` (inclusive o caso manipulado → primeira lista) — per FR-009, SC-003, S1
- [x] T006 [P] [US1] Write test `frontend/tests/unit/ListSelect.test.tsx` (novo): mostra as listas, permite uma única escolha e expõe o rótulo "Lista de destino" — per FR-001, FR-003, FR-007
- [x] T007 [P] [US1] Write test `frontend/tests/unit/useLists.test.ts` (novo): **padrão = primeira lista**, reset e recarga na troca de board, falha → lista vazia — per FR-002, FR-004, FR-005
- [x] T008 [P] [US1] Write test `frontend/tests/unit/CardForm.test.tsx`: envia `list_id` quando escolhido e mantém o payload de hoje quando não — per FR-005, SC-002
- [x] T009 [P] [US1] Write e2e `frontend/tests/e2e/lists.spec.ts` (novo): campo no final já com a primeira lista, troca aplicada no card criado, falha ao carregar → campo oculto e card salvo — per FR-001, FR-002, FR-005, SC-001, SC-004

**Checkpoint**: a suíte nova falha (RED) e a antiga continua verde

---

## Phase 2: Backend (GREEN)

- [x] T010 `backend/app/domain/card.py`: campo `list_id` opcional + normalização, com docstring citando **R8** — per FR-005, FR-006
- [x] T011 `backend/app/infrastructure/trello_client.py`: `list_lists(board_id)` (listas abertas: `{id, name}`) e reaproveitamento na busca da primeira lista — per FR-001, FR-009
- [x] T012 `backend/app/application/list_lists.py` (novo): caso de uso que devolve as listas do board — per FR-001
- [x] T013 `backend/app/application/create_card.py`: aceitar `list_id` e **validar pertencimento** ao board; senão usar a primeira lista — per FR-005, FR-006, R8
- [x] T014 `backend/app/api/routes.py`: `GET /boards/{board_id}/lists` autenticado (erro do Trello → 502) e `list_id` no corpo do `POST /cards` — per FR-009, S1

**Checkpoint**: backend verde e `GET /boards/{id}/lists` respondendo o contrato

---

## Phase 3: Frontend (GREEN)

- [x] T015 `frontend/src/services/api.ts`: tipo `BoardList {id, name}`, `fetchLists(boardId)` e `createCard(..., listId?)` enviando `list_id: listId ?? null` — per FR-005, FR-009
- [x] T016 `frontend/src/hooks/useLists.ts` (novo): carrega as listas do board, **padrão = primeira**, reseta e recarrega ao trocar de board e trata falha como lista vazia — per FR-002, FR-004, FR-005
- [x] T017 `frontend/src/components/ListSelect.tsx` (novo) + `frontend/src/styles/global.css`: seletor estilizado com rótulo "Lista de destino", nome longo sem quebrar o layout — per FR-003, FR-007, FR-008
- [x] T018 `frontend/src/components/CardForm.tsx` + `frontend/src/App.tsx`: o campo é o **último do formulário**, renderizado só quando há listas, e a escolha vai para a criação do card — per FR-001, FR-005, FR-010

**Checkpoint**: funcionalidade completa de ponta a ponta

---

## Phase 4: Documentação e fecho

- [x] T019 `docs/RULES.md` (nova **R8**) + `docs/GLOSSARY.md` (termo **Lista de destino**) — per R8, FR-010
- [x] T020 Rodar a suíte completa (pytest + vitest + Playwright) + `npm run build` e conferir contagens — per SC-005, FR-010
- [x] T021 Rodar o `quickstart.md` ponta a ponta (inclui board com uma lista só e falha de rede) — per SC-004

## Dependencies & Execution Order

- Fase 1 (testes) **antes** das fases 2 e 3.
- T010 → T011 → T012/T013 → T014 (backend, em cadeia); T005 depende de T011–T014.
- T015 → T016 → T017 → T018 (frontend, em cadeia).
- T019 em paralelo com as fases 2–3.
- T020/T021 por último.

## Notes

- **Nada existente é enfraquecido**: sem lista o comportamento é idêntico ao de hoje (SC-002) e os nomes
  acessíveis atuais permanecem (FR-010).
- O risco novo (card em lista de outro board) é tratado pela **R8**, com teste que a referencia.
- `createCard` chega a 6 parâmetros posicionais — mantido por consistência; candidato a objeto de opções
  numa limpeza futura (registrado no plan.md).
