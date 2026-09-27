# Tasks: Descrição do card

**Input**: Design documents from `/specs/006-descricao-do-card/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: obrigatórios — constituição III (test-first). Todo código nasce depois do teste que falha.

**Organization**: agrupadas por história de usuário (US1, US2) e pela atualização das regras.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1 (descrição no card), US2 (descrição longa e confortável)
- Caminhos exatos em cada tarefa

## Path Conventions

- Backend: `backend/app/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Foundational (domínio → API)

**⚠️ CRITICAL**: nenhuma história pode ser validada antes disso.

- [X] T001 [P] Write test `backend/tests/test_card.py` (RED): `Card` aceita `description`; só espaços/quebras → tratada como ausente; acima de 2.000 caracteres → erro; acentos, emojis e quebras preservados
- [X] T002 `backend/app/domain/card.py`: adicionar `description` + constante `MAX_DESCRIPTION_CHARS = 2000` + validações (e revogar a menção a R4 no docstring)
- [X] T003 [P] Write test `backend/tests/test_create_card.py` (RED): a descrição informada chega ao cliente do Trello; ausente → não é enviada
- [X] T004 `backend/app/application/create_card.py`: aceitar `description` e repassar ao cliente
- [X] T005 [P] Write test `backend/tests/test_trello_client.py` (RED): `create_card` inclui `desc` **somente** quando há texto
- [X] T006 `backend/app/infrastructure/trello_client.py`: `create_card(..., description)` → parâmetro `desc` condicional
- [X] T007 [P] Write test `backend/tests/test_routes.py` (RED): `POST /cards` com `description` → `201` e payload do Trello com `desc`; `description` acima do limite → `400` citando o limite (nunca o conteúdo); sem `description` → payload sem `desc`; título vazio com descrição preenchida → `400` (a descrição não substitui o título, FR-004); **não existe** rota de edição de card (`PATCH`/`PUT /cards/{id}` → `404`/`405`, guarda do FR-008)
- [X] T008 `backend/app/api/routes.py`: `CreateCardRequest.description` + repasse ao caso de uso

**Checkpoint**: backend aceita, valida e envia a descrição; testes de contrato verdes

---

## Phase 2: US1 (P1) — Escrever a descrição junto com o card 🎯 MVP

**Goal**: campo opcional, recolhido por padrão, que viaja junto do card.

**Independent Test**: abrir "adicionar descrição", digitar um texto e salvar — o card criado tem aquele texto.

- [X] T009 [P] [US1] Write test `frontend/tests/unit/CardForm.test.tsx` (RED): descrição recolhida por padrão (não ocupa a tela); abrir pelo gatilho; envio com o texto; limpeza e recolhimento após sucesso; texto preservado quando o salvamento falha; **com a descrição preenchida e o título vazio, o salvamento é recusado pela validação do título** (FR-004, título continua obrigatório)
- [X] T010 [US1] `frontend/src/services/api.ts`: `createCard(title, boardId, priority, description?)` enviando `description` só quando houver texto
- [X] T011 [US1] `frontend/src/components/CardForm.tsx`: gatilho "adicionar descrição", textarea, estado e reset no sucesso
- [X] T012 [P] [US1] `frontend/src/styles/global.css`: estilos do gatilho, do campo e do contador

**Checkpoint**: o fluxo ponta a ponta com descrição funciona; o card simples segue idêntico

---

## Phase 3: US2 (P2) — Descrição longa sem perder o botão

**Goal**: conforto no celular + limite explícito.

**Independent Test**: digitar um texto longo e confirmar que o botão continua alcançável e que o limite é sinalizado.

- [X] T013 [P] [US2] Write test `frontend/tests/unit/CardForm.test.tsx` (RED): contador `usado/2000`; acima do limite o **Salvar** fica bloqueado com aviso; o texto digitado **não** é cortado
- [X] T014 [US2] `frontend/src/components/CardForm.tsx`: contador, aviso e bloqueio do salvamento acima do limite
- [X] T015 [P] [US2] Write E2E `frontend/tests/e2e/description.spec.ts`: (a) card simples continua sem campo visível; (b) abrir → digitar → salvar envia a descrição; (c) acima do limite o botão fica bloqueado

**Checkpoint**: limites e conforto validados no viewport de celular

---

## Phase 4: Documentação e regras (R4 revogada)

- [X] T016 `docs/RULES.md`: revogar **R4** ("nesta versão não há campo descrição"), mantendo R1–R3 e R5
- [X] T017 `specs/002-inserir-card/spec.md`: registrar que o FR-006 foi superado pela feature 006 (rastreabilidade, sem reescrever o histórico)

---

## Phase 5: Polish & Cross-Cutting

- [X] T018 [P] Verificar que a descrição nunca aparece em logs nem em mensagens de erro (S8) — teste/asserção
- [X] T019 Rodar `quickstart.md` ponta a ponta (inclui o caso acima do limite e a falha de salvamento)
- [X] T020 Rodar a suíte completa (pytest + vitest + Playwright) e conferir a contagem de testes

---

## Dependencies & Execution Order

- **Foundational (T001–T008)**: T001 antes de T002, T003 antes de T004, T005 antes de T006, T007 antes de T008; as duplas (teste → código) podem avançar em paralelo entre si.
- **US1 (T009–T012)**: depende do Foundational; T009 → T011 (T010 e T012 em paralelo).
- **US2 (T013–T015)**: depende de US1 (estende o mesmo componente).
- **Documentação (T016–T017)**: em paralelo com as histórias (arquivos distintos).
- **Polish (T018–T020)**: por último.

## Notes

- Testes primeiro (Red → Green) — constituição III.
- **Alterar testes existentes exige aprovação humana** (regra de ouro): nesta feature os testes
  existentes de `POST /cards` ganham casos novos, sem enfraquecer os atuais.
- Sem banco de dados, sem dependências novas; a descrição só existe na criação.
- `[P]` = arquivos distintos, sem dependência.

---

## Phase 8: Convergence

> Resultado do `/speckit.converge` de 2026-09-26 (2 achados de severidade LOW).
> Ambos são de verificação/documentação — nenhuma mudança de comportamento.

- [X] T021 [P] `docs/GLOSSARY.md`: o verbete **Card** deve incluir a descrição opcional (hoje diz "título + prioridade + board") — per FR-009 (partial)
- [X] T022 [P] Write E2E `frontend/tests/e2e/description.spec.ts`: asserir explicitamente que o botão **Salvar** permanece **visível/alcançável** com um texto longo aberto, no viewport de celular — per SC-003 (partial)

