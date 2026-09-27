# Research: Etiqueta do card

**Feature**: `008-etiqueta-do-card` | **Date**: 2026-09-27

Decisões tomadas pelo agente (o dono pediu autonomia). Cada uma aponta o problema e o princípio aplicado.

## D1 — A etiqueta é identificada pelo **nome** (igual à prioridade)

- **Contexto**: o cliente já resolve etiqueta por nome (`find_label_id_by_name`) para aplicar a prioridade.
- **Decisão**: o frontend envia o **nome** da etiqueta; o servidor resolve o id no momento de criar o card.
- **Por quê**: paridade total com a prioridade (o pedido foi "igual prioridade"), zero novo conceito de
  identificador trafegando pelo cliente e reuso do caminho já testado.
- **Limitação assumida e registrada**: etiquetas **sem nome** (só cor) não podem ser escolhidas e portanto
  não são oferecidas (FR-011).

## D2 — Novo endpoint autenticado para listar as etiquetas do board

- **Decisão**: `GET /boards/{board_id}/labels` no BFF, com `require_auth` (R1/R2 mantidos).
- **Por quê**: o frontend **nunca** chama o Trello (R1); a lista precisa refletir o board atual e não uma
  lista fixa em configuração — foi o que o dono chamou de "etiquetas existentes".
- **Custo**: +1 requisição ao Trello por troca de board (bem dentro do orçamento P2).

## D3 — Excluir as etiquetas de prioridade na **camada de aplicação**

- **Decisão**: um caso de uso `list_labels(board_id)` remove da lista os nomes de `trello.priority_labels`.
- **Por quê**: a mesma etiqueta em dois controles geraria escolha ambígua e aplicação duplicada; e manter a
  regra na aplicação (e não na rota) torna a regra **testável isoladamente** (vira a R7).

## D4 — Seleção **única**, com "Sem etiqueta" como estado inicial

- **Decisão**: um chip "Sem etiqueta" + um chip por etiqueta do board; tocar troca a seleção.
- **Por quê**: é literalmente "igual prioridade" (1 toque, tudo visível, sem modal). Múltiplas etiquetas
  ficaria como extensão futura, se o uso pedir (não agora — proporcionalidade).

## D5 — Cor da etiqueta: mapa fixo, com fallback neutro

- **Decisão**: o servidor devolve o **nome da cor** do Trello; o frontend converte com um pequeno mapa
  (as cores clássicas + as variantes `*_dark`) e cai num cinza neutro quando não conhece a cor.
- **Por quê**: no Trello a cor é a identidade visual da etiqueta; sem ela, nomes parecidos ficam
  indistinguíveis. A cor é **decorativa**: o texto do chip é o nome, então nada quebra se a cor mudar.
- **Alternativa descartada**: trafegar o hex do servidor (acoplaria o backend à paleta do Trello).

## D6 — Falha ou ausência de etiquetas **nunca** bloqueia a captura

- **Decisão**: erro ao carregar → lista vazia → o item não é renderizado (sem mensagem de erro, sem espaço
  reservado); board sem etiquetas → idem.
- **Por quê**: protege o objetivo principal (P1/R: card em ≤10 s). A etiqueta é opcional: o usuário não pode
  perder a captura por causa de um enfeite.

## D7 — Troca de board descarta a escolha e recarrega a lista

- **Decisão**: o hook `useLabels(boardId)` recarrega quando o board muda e **limpa** a seleção.
- **Por quê**: etiqueta pertence ao board; manter a escolha anterior criaria um estado impossível
  ("etiqueta que não existe neste board") e um salvamento silenciosamente incompleto.

## D8 — Lembrar a etiqueta entre cards do mesmo board

- **Decisão**: manter a escolha após o sucesso, como já acontece com a prioridade.
- **Por quê**: quem lança vários cards do mesmo tipo economiza toques; é o mesmo racional aplicado na
  reformulação da interface.

## D9 — Sem cache e sem persistência

- **Decisão**: nenhum cache das etiquetas (nem em `localStorage`).
- **Por quê**: não há banco no MVP e a lista precisa refletir o Trello; o custo é 1 requisição por board.

## D10 — Contratos preservados, testes novos em cima

- **Decisão**: não alterar nomes acessíveis existentes nem o payload do card sem etiqueta (SC-002); os
  novos testes cobrem: escolha em 1 toque, card com etiqueta, card sem etiqueta, exclusão das prioridades,
  falha silenciosa, limpeza na troca de board, R7 (etiqueta inexistente → card sem ela).
