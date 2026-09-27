# Quickstart: etiqueta do card

**Feature**: `008-etiqueta-do-card`

## Pré-requisitos

- Features 001–007 implementadas; backend e frontend no ar.
- O board escolhido no Trello precisa ter etiquetas **com nome** (as de prioridade não aparecem).

## Validação manual (celular)

1. Abrir o app autenticado: abaixo de **Prioridade** aparece **Etiqueta** com as etiquetas do board atual,
   cada uma com seu ponto de cor.
2. Tocar em uma etiqueta: ela fica marcada **em um toque** (sem abrir nada); tocar em "Sem etiqueta" limpa.
3. Salvar: o card aparece no Trello **com a etiqueta** escolhida.
4. Salvar um card **sem tocar** em etiqueta: o card sai exatamente como antes (sem etiqueta nenhuma).
5. Trocar o board no chip do cabeçalho: a etiqueta escolhida é **limpa** e a lista é recarregada com as
   etiquetas do novo board.
6. Usar um board sem etiquetas (ou derrubar a rede antes de carregá-las): o item de etiqueta **não aparece**
   e o card continua podendo ser salvo normalmente.

## Verificação automatizada

```bash
cd backend && .venv/bin/python -m pytest -q
cd frontend && npm test && npx playwright test && npm run build
```

Cobertura nova desta feature:

- aplicação: etiqueta aplicada, payload sem etiqueta idêntico ao de hoje e R7 (etiqueta inexistente →
  card sem ela, sem erro);
- aplicação: `list_labels` **exclui** as etiquetas de prioridade (R3);
- infraestrutura: leitura de `name`/`color` e descarte de etiquetas sem nome;
- API: `GET /boards/{board_id}/labels` (200/401/502) e `POST /cards` com `label`;
- frontend: escolha em 1 toque, `useLabels` limpando na troca de board, falha → lista vazia e o item
  oculto (captura nunca bloqueada).
