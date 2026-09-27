# Feature Specification: Mais de uma etiqueta por card

**Feature Branch**: `010-multiplas-etiquetas`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "permita que eu possa escolher mais de uma etiqueta tb"

## Clarifications

### Session 2026-09-27 — decidido pelo agente (dono pediu autonomia)

- Q: Como marcar mais de uma? → A: os chips deixam de ser escolha única e passam a **ligar/desligar**
  (um toque por etiqueta); nenhuma marcada = card sem etiqueta.
- Q: O chip "Sem etiqueta" continua? → A: **não** — com várias escolhas ele não representa mais nada. No
  lugar dele, aparece um **"limpar"** discreto quando há pelo menos uma etiqueta marcada (evita 5 toques
  para desmarcar tudo).
- Q: Há limite de quantas? → A: **sem limite artificial** — as disponíveis são as do board (R7).
- Q: Etiqueta que desapareceu do board enquanto estava marcada? → A: sai da lista e da seleção; as outras
  continuam valendo (R7 já garante que nunca bloqueia).
- Q: A prioridade muda? → A: **não** — continua sendo uma escolha única (R3).
- Q: O contrato antigo (`label` único) muda? → A: o campo passa a ser **`labels` (lista)**; o campo antigo
  é aceito como **alias de transição** e somado à lista, para um PWA em cache não perder etiquetas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marcar o card com várias etiquetas (Priority: P1)

Como usuário único, quero marcar mais de uma etiqueta no mesmo card, como eu já faço no Trello, para não
precisar abrir o card lá depois só para acrescentar a segunda classificação.

**Why this priority**: é o pedido literal e a última limitação artificial do fluxo de captura.

**Independent Test**: marcar duas etiquetas, salvar e conferir que o card saiu com as duas.

**Acceptance Scenarios**:

1. **Given** as etiquetas do board, **When** o usuário toca em uma, **Then** ela fica marcada **sem
   desmarcar as outras** — um toque liga, outro desliga.
2. **Given** duas etiquetas marcadas, **When** o usuário salva, **Then** o card é criado com **as duas**.
3. **Given** nenhuma etiqueta marcada, **When** o usuário salva, **Then** o card sai **sem etiqueta**
   (como hoje).
4. **Given** etiquetas marcadas, **When** o usuário usa **"limpar"**, **Then** todas são desmarcadas de
   uma vez.

---

### User Story 2 - Não perder nada no caminho (Priority: P2)

Como usuário único, quero que a captura continue à prova de falhas: nenhuma etiqueta nova pode bloquear o
card nem apagar as escolhas que continuam válidas.

**Why this priority**: é o mesmo princípio que já protege a R7 — a etiqueta é opcional e o board é a
autoridade.

**Independent Test**: marcar uma etiqueta válida e uma que sumiu do board, salvar e conferir que o card
saiu com a válida.

**Acceptance Scenarios**:

1. **Given** uma etiqueta marcada que deixou de existir no board, **When** o usuário salva, **Then** o
   card é criado **com as demais** e sem erro.
2. **Given** falha ao carregar as etiquetas, **When** o usuário salva, **Then** o item não aparece e o
   card é criado normalmente.
3. **Given** a escolha feita, **When** o usuário troca de board, **Then** a seleção é limpa e a lista é
   recarregada.

### Edge Cases

- Todas as etiquetas marcadas: a barra de Salvar continua alcançável e o layout não quebra.
- "Limpar" com uma única etiqueta marcada: desmarca normalmente.
- Nome de etiqueta muito longo em várias linhas: sem vazar do chip.
- Payload com nomes repetidos: a etiqueta é aplicada uma única vez.
- Payload com etiqueta de outro board: ignorada (R7), nunca cria nada fora do board.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada etiqueta do board DEVE poder ser **ligada/desligada individualmente**, em um toque, sem
  afetar as demais.
- **FR-002**: DEVE ser possível marcar **quantas etiquetas existirem** no board (sem limite artificial).
- **FR-003**: Com pelo menos uma marcada, DEVE existir uma ação **"limpar"** que desmarca todas em um toque.
- **FR-004**: Sem nenhuma marcada, o card DEVE ser criado **sem etiqueta** (comportamento atual preservado).
- **FR-005**: O card DEVE ser criado com **todas** as etiquetas válidas marcadas.
- **FR-006**: Uma etiqueta que não existe mais no board DEVE ser ignorada **individualmente** — as demais
  continuam valendo e a captura não falha (R7 estendida).
- **FR-007**: Nomes repetidos NÃO DEVEM aplicar a etiqueta duas vezes.
- **FR-008**: A **prioridade continua sendo escolha única** (R3 inalterada).
- **FR-009**: Ao trocar de board a seleção DEVE ser limpa e a lista recarregada.
  *(Ajuste durante a implementação: a cláusula "etiquetas que sumiram da lista recarregada saem da
  seleção" foi removida por ser **inalcançável** — a lista só é recarregada junto com a troca de board,
  que já limpa tudo. Mantê-la seria código por precaução (A6). O servidor ignora nomes inexistentes de
  qualquer forma, R7.)*
- **FR-010**: Falha ao carregar as etiquetas NÃO DEVE bloquear a captura nem ocupar espaço na tela.
- **FR-011**: Cada escolha DEVE custar **um toque**, com alvo de toque ≥48 px.
- **FR-012**: O campo antigo (`label`, único) DEVE continuar sendo **aceito** e somado à lista, para um PWA
  em cache não perder etiquetas (alias de transição).
- **FR-013**: Nada existente DEVE quebrar: sem etiqueta o payload é equivalente ao de hoje e os nomes
  acessíveis e papéis cobertos por testes DEVEM ser preservados (o papel do conjunto passa a ser de caixas
  de seleção).

### Key Entities

- **Etiqueta**: classificação existente no board (nome + cor); agora **múltipla** e opcional por card.
- **Card (alterado)**: passa a registrar uma **coleção** de etiquetas em vez de uma só.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Marcar N etiquetas custa **N toques**; desmarcar todas custa **1** ("limpar") ou N (individual).
- **SC-002**: Card com 2 etiquetas marcadas é criado com **as 2**.
- **SC-003**: **0** cards bloqueados por etiqueta inexistente e **0** etiquetas aplicadas fora do board.
- **SC-004**: Card sem etiqueta mantém o comportamento de hoje.
- **SC-005**: **0** regressões: backend + unidade + E2E continuam verdes.

## Assumptions

- A prioridade (R3) e a lista de destino (R8) ficam **como estão**; esta feature mexe apenas na etiqueta.
- A etiqueta continua existindo **apenas na criação** (não há edição de cards).
- O alias `label` fica por uma versão e pode ser removido depois (registrado no contrato).
- Sem novas dependências, sem banco e sem novo segredo.

