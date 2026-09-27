# Data Model: Lista de destino do card

**Feature**: `009-lista-de-destino` | **Date**: 2026-09-27

Sem banco de dados (MVP): entidades em memória e o mapeamento para o Trello.

## Entidade: Card (alterada)

| Campo | Tipo | Obrigatório | Regra |
|-------|------|-------------|-------|
| `title` | texto | sim | não vazio após `strip` |
| `board_id` | texto | sim | não vazio após `strip` |
| `priority` | texto \| nulo | não | precisa estar em `trello.priority_labels` (R3) |
| `description` | texto \| nulo | não | `strip`; vazio → nulo; máx. 2.000 caracteres (R6) |
| `label` | texto \| nulo | não | aplicada só se existir no board (R7) |
| **`list_id`** | **texto \| nulo** | **não** | **usada só se pertencer ao board; senão o card vai para a primeira lista (R8)** |

Invariante novo:

- **R8**: A lista de destino é **opcional**: sem ela (ou se a informada **não pertencer ao board**, inclusive
  por ter sido apagada) o card é criado na **primeira lista aberta** do board. O card **nunca** é criado em
  lista de outro board e a captura **nunca** falha por causa da lista.

## Entidade: Lista de destino (leitura)

| Campo | Tipo | Origem | Observação |
|-------|------|--------|------------|
| `id` | texto | `GET /1/boards/{id}/lists?filter=open` | identifica a lista na criação |
| `name` | texto | idem | exibido no seletor; nomes longos são só texto |

**Lista oferecida ao usuário** = listas **abertas** do board, na ordem devolvida pelo Trello; a **primeira**
é o padrão (R8/FR-002).

## Fluxo de dados

```text
Trello --GET /1/boards/{id}/lists?filter=open--> TrelloClient.list_lists
                                                       |
                              GET /boards/{id}/lists (autenticado)
                                                       |
                                    frontend: useLists(board) -> ListSelect
                                    (padrão: primeira lista; troca de board recarrega e reseta)

frontend: createCard(title, board_id, priority, description, label, list_id)
                                                       |
                                                       v
   Card(list_id=...) -> R3/R6 validados -> R7 etiqueta -> R8: lista válida? senão primeira lista
                                                       |
                    POST /1/cards { idList: <lista validada>, idLabels?, desc? }
```

## Sem migração / sem persistência

- Nenhuma tabela, arquivo ou `localStorage`: a lista escolhida vive apenas no estado da tela (D7) e o padrão
  é sempre a primeira lista do board (D2).
