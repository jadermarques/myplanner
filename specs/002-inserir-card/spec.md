# Feature Specification: Inserir card no Trello

**Feature Branch**: `002-inserir-card`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Inserir cards no Trello em segundos: tela única com título, prioridade e seleção de board; cria o card via API REST do Trello (token somente no servidor)."

## Clarifications

### Session 2026-09-25

- Q: Onde guardar o "último board usado" (`last_used`), já que não há banco de dados nesta fase? → A: localStorage no frontend (lembra no aparelho), sem estado no backend.
- Q: Como tratar os labels de prioridade em relação ao board? → A: Assumir que os labels já existem; aplicar pelo nome. Se o label não existir, o card é criado sem ele.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Salvar um card no Trello (Priority: P1)

Como usuário único, digito o título do card, escolho o board e a prioridade e toco em "Salvar": o card é criado no board do Trello em segundos e vejo uma confirmação.

**Why this priority**: É o objetivo central do produto — lançar um card em até 10 segundos. Sem isso, o app não cumpre sua razão de existir.

**Independent Test**: Pode ser testado de forma independente criando um card pelo app e confirmando que ele aparece no board correto do Trello, com título e prioridade corretos.

**Acceptance Scenarios**:

1. **Given** título preenchido e board selecionado, **When** o usuário toca em "Salvar", **Then** o card é criado no board via API do Trello e uma mensagem de sucesso é exibida.
2. **Given** título vazio ou só com espaços, **When** o usuário tenta salvar, **Then** a validação impede e exibe erro no campo de título.
3. **Given** a API do Trello retorna erro, **When** o usuário salva, **Then** os campos digitados são preservados e uma mensagem acionável é exibida.

---

### User Story 2 - Escolher o board de destino (Priority: P2)

Como usuário único, seleciono o board de destino a partir da lista dos meus boards; o padrão é o último board usado.

**Why this priority**: O card precisa ir para o board certo; o padrão `last_used` acelera o fluxo (regra R5), mas sem a seleção o app não funciona para quem tem mais de um board.

**Independent Test**: Pode ser testado de forma independente abrindo o app e confirmando que o seletor lista os boards da conta, com o último usado pré-selecionado.

**Acceptance Scenarios**:

1. **Given** o app aberto, **When** o seletor de board carrega, **Then** exibe a lista dos boards do usuário, com o último usado selecionado por padrão.
2. **Given** vários boards disponíveis, **When** o usuário escolhe outro board e salva, **Then** o card é criado no board escolhido.

---

### User Story 3 - Escolher a prioridade (Priority: P3)

Como usuário único, seleciono uma prioridade entre os labels configurados (Muito alta, Alta, Média, Baixa, Muito baixa).

**Why this priority**: A prioridade é um dos dados do card (regra R3), mas o card pode ser criado sem ela — por isso vem depois do fluxo básico de salvar.

**Independent Test**: Pode ser testado de forma independente abrindo o seletor de prioridade e confirmando que lista apenas os labels configurados.

**Acceptance Scenarios**:

1. **Given** o seletor de prioridade aberto, **When** o usuário visualiza as opções, **Then** vê apenas os labels de `trello.priority_labels`.
2. **Given** uma prioridade escolhida, **When** o usuário salva, **Then** o label correspondente é aplicado ao card criado.

---

### Edge Cases

- O que acontece quando o token do Trello é inválido/revogado? O app deve exibir mensagem de erro acionável (ex.: "token inválido"), sem travar.
- O que acontece quando a API retorna 429 (rate limit)? O backend aplica backoff exponencial e tenta novamente; se persistir, retorna mensagem de erro.
- O que acontece quando a lista de boards está vazia? O app exibe mensagem orientando o usuário.
- O que acontece quando o usuário não seleciona prioridade? O card é criado sem label (prioridade é opcional).
- O que acontece quando os labels de prioridade não existem no board? Assumir que já existem; o app aplica o label pelo nome.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela DEVE ter um campo de título, um seletor de board, um seletor de prioridade e um botão "Salvar".
- **FR-002**: O título DEVE ser obrigatório (máximo de 512 caracteres); o app DEVE validar (rejeitar vazio ou só espaços) antes de salvar.
- **FR-003**: O card DEVE ser criado exclusivamente via API REST oficial do Trello; o frontend NUNCA chama o Trello diretamente (regra R1).
- **FR-004**: O token do Trello DEVE existir somente no servidor (regra R2).
- **FR-005**: As prioridades DEVEM limitar-se aos labels de `trello.priority_labels` (Muito alta, Alta, Média, Baixa, Muito baixa) (regra R3).
- **FR-006**: NÃO DEVE haver campo de descrição nesta versão (regra R4).
- **FR-007**: O board padrão DEVE ser o último usado (`ui.default_board: last_used`), guardado no localStorage do frontend; no primeiro uso (sem histórico), o padrão é o primeiro board da lista (regra R5).
- **FR-008**: Em caso de erro, os campos digitados DEVEM ser preservados e uma mensagem acionável DEVE ser exibida — ex.: "Erro ao salvar o card. Tente novamente." (token inválido → mensagem específica). (princípio VI)
- **FR-009**: Ao salvar com sucesso, o app DEVE exibir a mensagem "Card criado!" e limpar o campo de título (mantendo board e prioridade).
- **FR-010**: As chamadas ao Trello DEVEM respeitar rate limit abaixo de 100 req/10 s, com backoff exponencial em HTTP 429 (regra P2).
- **FR-011**: O backend DEVE expor a lista de boards do usuário para o seletor.
- **FR-012**: Enquanto a lista de boards carrega, o app DEVE exibir um indicador de carregamento; em caso de falha ao carregar, exibir mensagem acionável.

### Key Entities *(include if feature involves data)*

- **Card**: título (obrigatório), board de destino (obrigatório), prioridade/label (opcional).
- **Board**: quadro do Trello onde o card é criado (identificador e nome).
- **Label de prioridade**: um dos cinco labels configurados em `trello.priority_labels`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário abre o app e salva um card simples em até 10 segundos, sem contar o tempo de digitação (critério de sucesso principal do produto).
- **SC-002**: Em 100% dos casos de erro, os campos digitados são preservados e uma mensagem acionável é exibida.
- **SC-003**: O token do Trello nunca aparece em nenhum artefato de frontend (verificável por inspeção/build).
- **SC-004**: Um card salvo pelo app aparece no Trello com título, board e prioridade corretos.

## Assumptions

- As credenciais (`TRELLO_API_KEY` e `TRELLO_TOKEN`) já estão no `.env` (token só no servidor).
- Prioridade é opcional: um card pode ser criado sem label.
- Board é obrigatório, com padrão `last_used`, guardado no localStorage do frontend.
- Os labels de prioridade são assumidos existentes no board; o app aplica o label pelo nome e, se o label não existir, cria o card sem ele (não cria labels).
- A lista de boards vem da API do Trello (boards do membro autenticado).
- Integração com o Trello é a primeira integração externa do projeto (gatilho de ADR na fase de plan).
