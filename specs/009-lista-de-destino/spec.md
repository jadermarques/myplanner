# Feature Specification: Lista de destino do card

**Feature Branch**: `009-lista-de-destino`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "inclua no final da tela a opcao de escolher a lista de destino (do board selecionado). por padrao deixa a primeira lista do board. devo escolher apenas uma lista"

## Clarifications

### Session 2026-09-27 — decidido pelo agente (dono pediu autonomia)

- Q: Chips (como prioridade/etiqueta) ou seletor de lista? → A: **seletor estilizado** (o mesmo desenho do
  chip do board). Motivo: a lista quase nunca muda (o padrão já vem certo), os nomes são longos e podem
  existir muitas listas — o controle precisa ser **discreto** antes de ser rápido, e uma terceira parede de
  chips empurraria o formulário. A escolha continua sendo **de uma única lista** (pedido explícito).
- Q: Onde exatamente no final da tela? → A: como último campo do formulário, **imediatamente acima da barra
  de Salvar**, com rótulo "Lista de destino".
- Q: O padrão é a primeira lista mesmo se o usuário já escolheu outra antes? → A: **sim** — o pedido é
  literal ("por padrão deixa a primeira lista do board"); a escolha vale para o card atual (não é memorizada).
- Q: E se a lista escolhida for apagada ou não pertencer ao board? → A: o card é criado na **primeira lista**
  do board — nunca em outro board e nunca bloqueando (mesmo espírito da R7).
- Q: E se as listas não carregarem? → A: o campo não aparece e o card é criado na primeira lista, como hoje.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escolher a lista de destino do card (Priority: P1)

Como usuário único, quero escolher em qual lista do board o card vai cair, para não precisar movê-lo no
Trello depois do lançamento.

**Why this priority**: é o pedido literal e o único ponto do fluxo em que o app ainda decidia sozinho o
destino do card.

**Independent Test**: abrir o app autenticado, trocar a lista de destino e salvar; o card deve nascer na
lista escolhida.

**Acceptance Scenarios**:

1. **Given** a tela de captura com um board selecionado, **When** o formulário carrega, **Then** o campo
   "Lista de destino" aparece no final, já mostrando a **primeira lista** do board.
2. **Given** o campo visível, **When** o usuário escolhe outra lista, **Then** a escolha é única (troca, não
   acumula) e acontece em um toque a partir do próprio campo.
3. **Given** uma lista escolhida, **When** o usuário salva, **Then** o card é criado naquela lista.
4. **Given** uma lista escolhida, **When** o usuário troca de board, **Then** a escolha volta para a primeira
   lista do novo board.

---

### User Story 2 - Nada piora quando não quero escolher (Priority: P2)

Como usuário único, quero que a captura rápida continue igual quando eu não tocar no campo, ou quando as
listas não carregarem.

**Why this priority**: protege o objetivo principal (card em ≤10 s) — o destino padrão precisa continuar
sendo decidido pelo app sem nenhum toque.

**Independent Test**: salvar sem tocar no campo; depois, simular falha ao carregar as listas e salvar mesmo
assim, conferindo que o card caiu na primeira lista.

**Acceptance Scenarios**:

1. **Given** a tela de captura, **When** o usuário salva sem tocar no campo, **Then** o card vai para a
   primeira lista do board, como sempre foi.
2. **Given** falha ao carregar as listas, **When** o usuário salva, **Then** o card é criado na primeira
   lista e a captura não é bloqueada nem avisada com erro.
3. **Given** uma lista escolhida que deixou de existir, **When** o usuário salva, **Then** o card é criado
   na primeira lista (sem erro e sem card em outro board).

### Edge Cases

- Board com **uma única** lista aberta: o campo aparece com essa lista e nada mais pode ser escolhido.
- Board **sem listas abertas**: o campo não aparece e o salvamento continua bloqueado como hoje (o backend
  já responde que o board não tem listas abertas).
- Nome de lista muito longo: o texto não vaza do controle nem esconde a ação primária.
- **Payload manipulado** com a lista de outro board: o card **não** pode ser criado fora do board.
- Troca de board enquanto a lista anterior estava escolhida: a escolha é descartada.
- Fonte ampliada pelo sistema: o campo continua legível e tocável.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de captura DEVE oferecer, como **último campo do formulário**, a escolha da **lista de
  destino** entre as listas **abertas** do board atual.
- **FR-002**: O padrão DEVE ser a **primeira lista** do board.
- **FR-003**: A escolha DEVE ser **de uma única lista** (trocar, não acumular).
- **FR-004**: Ao **trocar de board**, a escolha DEVE ser descartada e as listas DEVE ser recarregadas.
- **FR-005**: Sem escolha explícita — ou sem listas carregadas — o card DEVE ser criado na **primeira lista**,
  exatamente como hoje.
- **FR-006**: A lista escolhida DEVE pertencer ao board informado; se não pertencer (ou tiver sido apagada),
  o card DEVE ser criado na primeira lista — **nunca** em lista de outro board e **nunca** com erro.
- **FR-007**: A lista atual DEVE estar visível sem interação e a troca DEVE partir do próprio campo.
- **FR-008**: Nomes longos de lista NÃO DEVEM quebrar o layout nem esconder a ação primária.
- **FR-009**: As listas DEVEM vir do Trello **pelo servidor** (o frontend nunca chama o Trello).
- **FR-010**: Nada existente DEVE mudar: sem lista escolhida o resultado é idêntico ao de hoje e os nomes
  acessíveis e papéis já cobertos por testes DEVEM ser preservados.

### Key Entities

- **Lista de destino**: lista do board (identificador + nome) onde o card será criado; escolha única e
  opcional, com a primeira lista como padrão.
- **Card (alterado)**: passa a registrar também a lista de destino, na criação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trocar a lista custa **1 toque** a partir do campo; manter o padrão custa **0**.
- **SC-002**: Card salvo sem escolher lista produz **exatamente o mesmo comportamento** de hoje.
- **SC-003**: **0** cards criados em lista de outro board, mesmo com requisição manipulada.
- **SC-004**: **0** bloqueios de captura causados pela lista (falha de rede, lista inexistente, board sem
  listas).
- **SC-005**: **0** regressões: toda a suíte existente (backend + unidade + E2E) continua verde.

## Assumptions

- A escolha da lista vale para o card atual: **não** é memorizada entre sessões (o padrão é sempre a
  primeira lista, como pedido).
- Listas **arquivadas/fechadas** não são oferecidas (o app sempre trabalhou apenas com listas abertas).
- Não há movimentação/edição de cards depois de criados (fora do escopo do produto).
- Sem novas dependências, sem banco de dados, sem novo segredo e sem mudança no modelo de segurança.

