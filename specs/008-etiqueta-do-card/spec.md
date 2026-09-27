# Feature Specification: Etiqueta do card (etiquetas existentes do board)

**Feature Branch**: `008-etiqueta-do-card`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "pode incluir o item de etiqueta igual prioridade, com as etiquetas existentes?"

> **Superada parcialmente pela 010** (`specs/010-multiplas-etiquetas`): a escolha de etiqueta deixou de ser
> **única** e passou a ser **múltipla** (o campo do contrato é `labels`, uma lista; o antigo `label` segue
> aceito como alias de transição). A **FR-003** desta spec (escolha única / "Sem etiqueta") está superada.
> As demais regras seguem valendo na forma emendada da **R7** em `docs/RULES.md`.

## Clarifications

### Session 2026-09-27 — decidido pelo agente (dono pediu autonomia: "faça tudo sozinho, não me pergunte nada")

- Q: "As etiquetas existentes" são quais? → A: as etiquetas **reais do board no Trello** (lidas da API do
  Trello), não uma lista fixa em configuração — é o que o usuário vê hoje no Trello.
- Q: Escolha única ou várias? → A: **única** ("Sem etiqueta" + N etiquetas), **igual à prioridade**:
  um toque, todas visíveis, sem seletor modal.
- Q: As 5 etiquetas usadas como prioridade também aparecem aqui? → A: **não** — ficam fora da lista de
  etiquetas para o mesmo rótulo não existir em dois controles e não ser aplicado duas vezes.
- Q: A etiqueta é lembrada entre cards? → A: **sim** (igual à prioridade, economiza toques numa sequência),
  mas é **limpa ao trocar de board**, porque etiqueta pertence ao board.
- Q: E se as etiquetas não carregarem ou o board não tiver nenhuma? → A: a captura **continua funcionando**:
  a etiqueta é opcional e nunca bloqueia o salvamento.
- Q: Mostrar a cor da etiqueta? → A: **sim**, um ponto colorido com a cor do Trello — é a identidade da
  etiqueta e ajuda a diferenciar nomes parecidos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marcar o card com uma etiqueta do board em um toque (Priority: P1)

Como usuário único, quero escolher uma das etiquetas que já existem no meu board com um único toque, para
que o card entre no Trello já classificado como eu classifico hoje.

**Why this priority**: é o pedido literal — a etiqueta é a forma de classificação que já uso no Trello.

**Independent Test**: abrir o app autenticado, ver as etiquetas do board atual, tocar em uma e salvar;
o card criado deve carregar aquela etiqueta.

**Acceptance Scenarios**:

1. **Given** um board com etiquetas, **When** a tela de captura carrega, **Then** as etiquetas existentes
   aparecem como opções visíveis, cada uma com sua cor.
2. **Given** as etiquetas visíveis, **When** o usuário toca em uma, **Then** ela fica marcada em um toque,
   sem seletor modal, e pode ser trocada ou desmarcada ("Sem etiqueta").
3. **Given** uma etiqueta marcada, **When** o usuário salva, **Then** o card é criado com aquela etiqueta.
4. **Given** uma etiqueta marcada, **When** o usuário troca de board, **Then** a seleção é limpa (a etiqueta
   pertence ao board anterior).

---

### User Story 2 - Não atrapalhar quem não usa etiqueta (Priority: P2)

Como usuário único, quero que a captura continue rápida quando eu não quiser etiqueta nenhuma, ou quando o
board não tiver etiquetas.

**Why this priority**: protege o objetivo principal (card em ≤10 s) e evita que uma dependência externa
(as etiquetas) possa impedir o salvamento.

**Independent Test**: salvar um card sem tocar em etiqueta nenhuma; depois, simular a falha ao carregar as
etiquetas e salvar mesmo assim.

**Acceptance Scenarios**:

1. **Given** a tela de captura, **When** o usuário não toca em nenhuma etiqueta, **Then** o card é criado
   sem etiqueta, exatamente como hoje.
2. **Given** um board sem etiquetas disponíveis, **When** a tela carrega, **Then** o item de etiqueta não
   ocupa espaço nem polui o formulário.
3. **Given** falha ao carregar as etiquetas, **When** o usuário salva um card, **Then** o card é criado
   normalmente (falha silenciosa e não bloqueante).

### Edge Cases

- O board troca enquanto a lista de etiquetas estava carregada: a etiqueta escolhida é descartada.
- A etiqueta escolhida deixa de existir no board entre a escolha e o salvamento: o card é criado **sem**
  ela (mesma regra já aplicada à prioridade).
- Etiquetas sem nome (só cor, caso existam no board): não são oferecidas, porque a escolha é feita pelo nome.
- Board com muitas etiquetas: as opções quebram em linhas e nenhuma fica inalcançável.
- Etiqueta com nome muito longo: o texto não vaza do chip nem empurra a ação primária para fora.
- Fonte ampliada pelo sistema: as opções continuam legíveis e tocáveis.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de captura DEVE oferecer as etiquetas que **existem no board atual**, com o nome visível.
- **FR-002**: Cada opção DEVE exibir a **cor** da etiqueta, como no Trello.
- **FR-003**: A escolha DEVE custar **um toque**, com todas as opções visíveis ao mesmo tempo (sem seletor modal).
- **FR-004**: DEVE existir a opção **"Sem etiqueta"**, que é o estado inicial.
- **FR-005**: As etiquetas usadas como **prioridade** NÃO DEVEM aparecer na lista de etiquetas.
- **FR-006**: Sem etiqueta escolhida, o card DEVE ser criado **exatamente como hoje** (sem etiqueta).
- **FR-007**: Ao **trocar de board**, a etiqueta escolhida DEVE ser descartada e a lista DEVE ser recarregada.
- **FR-008**: Sem etiquetas disponíveis ou com falha ao carregá-las, o item **NÃO DEVE ocupar espaço** no
  formulário e **NÃO DEVE** bloquear a criação do card.
- **FR-009**: A etiqueta escolhida DEVE ser **lembrada entre cards do mesmo board**.
- **FR-010**: Se a etiqueta escolhida não existir mais no board na hora de salvar, o card DEVE ser criado
  **sem ela** (sem erro para o usuário) — mesma regra já aplicada à prioridade.
- **FR-011**: Etiquetas **sem nome** NÃO DEVEM ser oferecidas (a escolha é feita pelo nome).
- **FR-012**: Nomes longos NÃO DEVEM quebrar o layout nem esconder a ação primária.
- **FR-013**: A lista de etiquetas DEVE vir do Trello **pelo servidor** (o frontend nunca chama o Trello).
- **FR-014**: Nenhuma regra existente (prioridade, descrição, limites, segurança) DEVE mudar e os **nomes
  acessíveis** já cobertos por testes DEVEM ser preservados.

### Key Entities

- **Etiqueta**: classificação existente no board do Trello, identificada por **nome** e exibida com sua
  **cor**; a seleção é única e opcional.
- **Card (alterado)**: passa a ter também a **etiqueta** escolhida, opcional, aplicada apenas na criação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Escolher uma etiqueta custa **1 toque**; não escolher custa **0**.
- **SC-002**: Card salvo sem etiqueta produz **exatamente o mesmo payload** de hoje.
- **SC-003**: **0** bloqueios de captura causados por ausência ou falha das etiquetas.
- **SC-004**: **0** regressões: toda a suíte existente (unidade + E2E) continua verde.
- **SC-005**: **0** casos de etiqueta "presa" de outro board após a troca.

## Assumptions

- Etiqueta existe **apenas na criação** do card (não há edição de cards no escopo do produto).
- As etiquetas são lidas do board no momento do uso; não há cache nem banco de dados (não há DB no MVP).
- A prioridade continua sendo o label configurado em `trello.priority_labels`; a etiqueta é um campo
  **independente** e adicional.
- Sem novas dependências, sem mudança no modelo de segurança e sem novo segredo.
- O servidor segue sendo a autoridade: o frontend só transporta a escolha.

