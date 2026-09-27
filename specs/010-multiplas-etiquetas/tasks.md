# Tasks: Mais de uma etiqueta por card

**Input**: Design documents from `/specs/010-multiplas-etiquetas/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/api.md

**Tests**: obrigatórios (TDD, AGENTS.md A10). Cada regra tocada (R3, R7, R8) tem ao menos um teste que a cita.

**Organization**: por história — US1 (P1, marcar várias) e US2 (P2, não perder nada).

## Phase 1: Setup

- [x] T001 Confirmar branch/limpeza: `git status` limpo e `VERSION` em `0.10.0` (ponto de restauração atual).
- [x] T002 Registrar no `docs/RULES.md` a **emenda da R7** (etiquetas no plural, quantas quiser, ignoradas
  individualmente) com referência à feature 010 (Red: nenhuma — é documentação, muda junto com o código).

## Phase 2: Foundational (bloqueia as duas histórias)

- [x] T003 [P] `backend/tests/test_card.py`: **Red** — `Card.labels` como tupla, sem vazios, sem repetição,
  ordem preservada; `labels=()` quando nada é informado.
- [x] T004 [P] `backend/tests/test_trello_client.py`: **Red** — `find_label_ids_by_names` lê o board **uma
  vez** e devolve só os ids existentes, na ordem pedida; `find_label_id_by_name` continua funcionando
  (delegando).
- [x] T005 `backend/app/domain/card.py`: **Green** — trocar `label: str | None` por `labels: tuple[str, ...]`
  com normalização (strip, sem vazios, sem repetição).
- [x] T006 `backend/app/infrastructure/trello_client.py`: **Green** — `find_label_ids_by_names` + o método
  antigo delegando.

## Phase 3: US1 — marcar várias etiquetas (P1) 🎯 MVP

- [x] T007 `backend/tests/test_create_card.py`: **Red** — duas etiquetas válidas → `idLabels` com as duas;
  nenhuma → sem `idLabels`; nomes repetidos → id único (R7, R3 preservada).
- [x] T008 `backend/app/application/create_card.py`: **Green** — resolver prioridade + etiquetas em **uma**
  leitura do board; aplicar todas as válidas; sem válidas, não enviar `idLabels`.
- [x] T009 `backend/tests/test_routes.py`: **Red** — `labels` (lista) chega ao caso de uso; lista vazia ou
  ausente → nenhuma; `label` (antigo) é aceito e somado.
- [x] T010 `backend/app/api/routes.py`: **Green** — campo `labels: list[str] | None` + alias `label`.
- [x] T011 [P] `frontend/tests/unit/useLabels.test.ts`: **Red** — `toggleLabel` liga/desliga sem afetar as
  outras; `clearLabels` limpa; troca de board limpa; recarregar descarta seleção que não existe mais.
- [x] T012 [P] `frontend/tests/unit/LabelSelect.test.tsx`: **Red** — caixas de seleção com o nome acessível
  de cada etiqueta; duas marcadas ao mesmo tempo; "limpar" aparece só com ≥1 marcada e desmarca todas.
- [x] T013 `frontend/src/hooks/useLabels.ts` + `frontend/src/components/LabelSelect.tsx`: **Green**.
- [x] T014 `frontend/tests/unit/CardForm.test.tsx`: **Red** → **Green** — o formulário envia a lista de
  etiquetas marcadas; sem nenhuma marcada envia `undefined`/vazio (payload equivalente ao de hoje, SC-004).
- [x] T015 `frontend/src/services/api.ts` + `frontend/src/components/CardForm.tsx` + `styles/global.css`:
  **Green** — `createCard(..., labels?: string[])`, ação "limpar" com alvo ≥48 px.

## Phase 4: US2 — não perder nada (P2)

- [x] T016 `backend/tests/test_create_card.py`: **Red** → **Green** — uma etiqueta inexistente + uma válida →
  o card sai **com a válida** e sem erro; nenhuma válida → sem `idLabels` (R7 estendida, SC-003).
- [x] T017 `frontend/tests/unit/useLabels.test.ts`: falha ao carregar → lista vazia, seleção limpa, captura
  não bloqueada (R7/FR-010).

## Phase 5: E2E e convergência

- [x] T018 `frontend/tests/e2e/labels.spec.ts`: **Red** → **Green** — marcar duas e salvar (as duas no
  payload); desmarcar uma (só a outra); "limpar" (nenhuma).
- [x] T019 `docs/GLOSSARY.md`: registrar que "Etiqueta" agora é múltipla por card; atualizar
  `specs/008-etiqueta-do-card/spec.md` com o aviso de FR-003 superada pela 010.
- [x] T020 Convergir: `pytest` (backend), `vitest` + `npm run build` (frontend), `playwright` (E2E),
  `gitleaks`; depois o gancho de release (A9: VERSION + commit + tag + sugestão de push).

## Dependencies

- T005/T006 antes de T008; T010 depende de T008; T013 depende de T011/T012; T015 depende de T014.
- US2 depende da Phase 3 (mesmo caminho de resolução de etiquetas).

## Parallel Example

```bash
# Red em paralelo, sem tocar nos mesmos arquivos:
pytest tests/test_card.py tests/test_trello_client.py      # T003, T004
npm test -- tests/unit/useLabels.test.ts tests/unit/LabelSelect.test.tsx   # T011, T012
```

## Implementation Strategy

MVP = Phase 1–3 (marcar várias etiquetas de ponta a ponta). A Phase 4 é a blindagem (etiqueta sumida / falha
de rede) e a Phase 5 fecha com E2E, documentação e release. Cada fase termina com a suíte **verde**.
