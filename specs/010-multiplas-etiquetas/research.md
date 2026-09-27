# Research: Mais de uma etiqueta por card

**Feature**: `010-multiplas-etiquetas` | **Date**: 2026-09-27

## D1 — Caixas de seleção no lugar do grupo de rádio

- **Decisão**: os chips continuam iguais visualmente, mas o controle passa a ser uma **caixa de seleção**
  (`type="checkbox"`) por etiqueta, dentro de um grupo com rótulo "Etiqueta".
- **Por quê**: ligar/desligar sem afetar os outros é exatamente a semântica de checkbox; mantém 1 toque e o
  alvo de 48 px já existentes. Trocar o papel do conjunto é aceitável porque o pedido muda a natureza da
  escolha (FR-013 registra isso).

## D2 — "Sem etiqueta" sai; entra "limpar"

- **Decisão**: sem chip "Sem etiqueta" (com várias escolhas ele não representa nada); com pelo menos uma
  marcada aparece um **"limpar"** discreto ao lado do rótulo.
- **Por quê**: "nenhuma marcada" já comunica o estado vazio; sem "limpar", desmarcar 5 etiquetas custaria 5
  toques (SC-001).

## D3 — Resolver todos os nomes em **uma** leitura do board

- **Problema**: o cliente resolvia etiqueta por etiqueta (`find_label_id_by_name` → 1 requisição cada).
  Com várias etiquetas isso multiplicaria chamadas ao Trello (orçamento P2).
- **Decisão**: novo `find_label_ids_by_names(board_id, names)` que lê o board **uma vez** e devolve os ids na
  ordem pedida, ignorando os que não existem; o método antigo passa a **delegar** para ele (segue testado e
  usado).
- **Por quê**: N etiquetas passam a custar 1 requisição; a prioridade e as etiquetas são resolvidas no mesmo
  conjunto (sem repetir ids).

## D4 — Uma etiqueta inexistente não derruba as outras (R7 estendida)

- **Decisão**: nomes desconhecidos são **ignorados individualmente**; os válidos são aplicados.
- **Por quê**: é o mesmo princípio que já protegia o caso de etiqueta única, agora aplicado por item — nunca
  bloquear a captura e nunca perder trabalho por causa de um dado que o board já não tem.

## D5 — Deduplicação e ordem

- **Decisão**: no domínio, `labels` é uma **tupla** sem vazios e sem repetição, preservando a ordem de
  escolha; no cliente do Trello os ids entram uma única vez (`idLabels` sem repetição).
- **Por quê**: repetição no payload não pode virar etiqueta duplicada; tupla mantém a entidade imutável e
  hashable (é um `dataclass(frozen=True)`).

## D6 — Alias `label` por uma versão

- **Decisão**: a API aceita `labels` (lista) e, para transição, o antigo `label` (único) somado à lista.
- **Por quê**: um PWA em cache no celular pode continuar enviando o campo antigo por um tempo; sem o alias,
  a etiqueta seria **silenciosamente** descartada (exatamente o tipo de falha muda que já nos custou tempo na
  008). Sai numa próxima versão, registrado no contrato.

## D7 — Troca de board limpa a seleção (e nada além disso)

- **Decisão**: `useLabels` limpa a seleção quando o board muda e recarrega a lista. **Não** há filtro
  "descarta da seleção o que sumiu do board": durante a implementação verificou-se que esse caso é
  **inalcançável** — a lista só é recarregada junto com a troca de board, que já zera a seleção, e um
  remonte do componente também parte do zero. Implementá-lo seria código por precaução (A6); a spec
  (FR-009) foi ajustada em vez disso.
- **Por quê**: evita mandar ao servidor nomes de outro board (que a R7 ignoraria) e mantém o usuário
  vendo exatamente o que será aplicado.
