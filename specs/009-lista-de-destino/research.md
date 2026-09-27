# Research: Lista de destino do card

**Feature**: `009-lista-de-destino` | **Date**: 2026-09-27

Decisões do agente (o dono pediu autonomia). Cada uma aponta o problema e o princípio aplicado.

## D1 — Seletor discreto, não uma terceira parede de chips

- **Problema**: prioridade e etiqueta já são duas paredes de chips no formulário.
- **Decisão**: um **seletor estilizado** (mesmo desenho do chip do board) como último campo, mostrando a
  lista atual.
- **Por quê**: a lista quase nunca muda (o padrão já vem certo), pode haver muitas e os nomes são longos.
  O controle precisa ser **discreto** antes de ser rápido; mais uma parede de chips empurraria a barra de
  Salvar e poluiria a tela. A escolha continua sendo de **uma única lista** (pedido explícito).
- **Trade-off assumido**: trocar a lista custa 1 toque para abrir + 1 para escolher (o picker nativo é
  rápido e acessível). Manter o padrão custa **0**.

## D2 — Padrão: primeira lista, sem memorizar

- **Decisão**: o padrão é sempre a **primeira lista** do board (a escolha vale para o card atual).
- **Por quê**: foi o pedido literal ("por padrão deixa a primeira lista do board") e mantém o comportamento
  que o backend já tinha (`get_first_list_id`), o que garante SC-002 sem esforço.

## D3 — Validação de pertencimento na aplicação (nova R8)

- **Problema**: se o cliente mandasse uma lista de **outro board**, o card nasceria no lugar errado — o erro
  mais caro do produto e o único risco novo trazido por esta feature.
- **Decisão**: o caso de uso lê as listas abertas do board e só usa a lista escolhida **se ela estiver entre
  elas**; caso contrário usa a primeira.
- **Por quê**: `POST /cards` já recebe `board_id` do cliente; aceitar um `list_id` sem verificar seria confiar
  em dado cruzado do cliente. A checagem na **aplicação** (não na rota) a torna testável isoladamente.
- **Alternativa descartada**: responder `400` quando a lista não pertence ao board. Bloquearia a captura no
  caso real de "a lista foi apagada entre carregar e salvar" (SC-004) e não traz ganho: cair na primeira
  lista é seguro e silencioso — o mesmo espírito da R7.

## D4 — Novo endpoint autenticado para listar as listas

- **Decisão**: `GET /boards/{board_id}/lists` no BFF, com `require_auth`, devolvendo `{id, name}` em ordem de
  board, apenas listas abertas.
- **Por quê**: o frontend nunca fala com o Trello (R1/R2) e as listas precisam refletir o board atual.
- **Reuso**: o cliente do Trello já buscava as listas do board para pegar a primeira (`filter=open`); o
  método novo apenas devolve a coleção em vez do primeiro item.

## D5 — Falha ao carregar listas: o campo desaparece e o padrão assume

- **Decisão**: erro ao carregar → lista vazia → o campo não é renderizado e o salvamento segue sem `list_id`.
- **Por quê**: idêntico ao que já foi decidido para etiquetas (D6 da 008): nada de bloquear a captura por um
  campo opcional, e o servidor já sabe escolher a primeira lista.

## D6 — Troca de board descarta a escolha

- **Decisão**: o hook `useLists(boardId)` recarrega ao trocar de board e volta o padrão (primeira lista).
- **Por quê**: a lista pertence ao board; manter a escolha anterior criaria um id de outro board (que a R8
  iria descartar em silêncio — melhor nem permitir o estado).

## D7 — Sem cache, sem persistência

- **Decisão**: nada de `localStorage` nem cache das listas.
- **Por quê**: sem banco no MVP, e a lista precisa ser a real; o custo é 1 requisição por troca de board.

## D8 — Contratos preservados, testes novos em cima

- **Decisão**: o payload sem lista continua idêntico (SC-002) e os nomes acessíveis atuais permanecem
  (FR-010). Testes novos cobrem: padrão = primeira lista, escolha aplicada, lista de outro board → primeira
  lista (R8), lista apagada → primeira lista, falha de rede → campo oculto e card salvo, e a limpeza na troca
  de board.
