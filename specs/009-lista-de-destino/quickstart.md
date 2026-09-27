# Quickstart: lista de destino do card

**Feature**: `009-lista-de-destino`

## Pré-requisitos

- Features 001–008 implementadas; backend **reiniciado** (com `--reload` ele acompanha sozinho) e frontend no ar.
- O board escolhido precisa ter pelo menos uma lista **aberta**.

## Validação manual (celular)

1. Abrir o app autenticado: no **final do formulário**, acima de **Salvar**, aparece **Lista de destino** já
   apontando para a **primeira lista** do board.
2. Salvar **sem tocar** no campo: o card nasce na primeira lista (comportamento de sempre, 0 toques).
3. Escolher outra lista e salvar: o card nasce **na lista escolhida**.
4. Trocar o board no chip do cabeçalho: o campo volta para a **primeira lista do novo board**.
5. Board com uma única lista: o campo mostra essa lista e não oferece outra opção.
6. Derrubar a rede antes de carregar as listas: o campo **não aparece** e o card ainda pode ser salvo (vai
   para a primeira lista).

## Verificação automatizada

```bash
cd backend && .venv/bin/python -m pytest -q
cd frontend && npm test && npx playwright test && npm run build
```

Cobertura nova desta feature:

- aplicação: **R8** — lista válida é usada; lista de outro board, lista apagada, ausente ou vazia → primeira
  lista; sem lista informada o payload é idêntico ao de hoje;
- aplicação/infra: `list_lists` devolve as listas abertas na ordem do board;
- API: `GET /boards/{board_id}/lists` (200/401/502) e `POST /cards` com `list_id` (incluindo o caso
  manipulado com lista de outro board → card na primeira lista do board informado);
- frontend: `useLists` (padrão = primeira lista, reset na troca de board, falha → campo oculto),
  `ListSelect` (escolha única) e `CardForm` enviando `list_id` só quando escolhido.
