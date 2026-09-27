# Feature Specification: Descrição do card

**Feature Branch**: `006-descricao-do-card`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Adicionar campo de descrição do card na tela única: a descrição é opcional e vai junto com o card criado no Trello."

## Clarifications

### Session 2026-09-26

- Q: Qual o limite de caracteres da descrição e o comportamento ao ultrapassá-lo? → A: limite de **2.000 caracteres**, com contador visível e salvamento bloqueado ao ultrapassar (mantém o card enxuto).
- Q: O campo de descrição fica sempre visível ou recolhido por padrão? → A: **recolhido** atrás de "adicionar descrição"; só abre quando o usuário quiser.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escrever uma descrição junto com o card (Priority: P1)

Como usuário único, quero escrever uma descrição opcional junto do título e da prioridade, para que o card já nasça no Trello com o contexto que eu tinha em mãos.

**Why this priority**: é a lacuna mais visível do fluxo principal. Hoje o card nasce só com título e prioridade, e o contexto precisa ser completado depois dentro do app do Trello — exatamente o que este app existe para evitar.

**Independent Test**: criar um card informando título + descrição e confirmar no Trello que o card tem exatamente aquela descrição.

**Acceptance Scenarios**:

1. **Given** a tela de criação, **When** o usuário informa título, descrição e prioridade e salva, **Then** o card é criado no board escolhido com a descrição informada.
2. **Given** a tela de criação, **When** o usuário salva com a descrição em branco, **Then** o card é criado normalmente, sem descrição (o campo é opcional e não bloqueia nada).
3. **Given** um card salvo com sucesso, **When** o formulário é limpo, **Then** o campo de descrição volta vazio e recolhido (não reaproveita o texto do card anterior).
4. **Given** a tela de criação, **When** o usuário não abre o campo de descrição, **Then** a tela e o tempo de salvar permanecem iguais aos de hoje (o campo não ocupa espaço nenhum).

---

### User Story 2 - Escrever uma descrição longa no celular sem perder o botão (Priority: P2)

Como usuário único, quero escrever descrições de vários parágrafos com conforto no celular, sem que o campo empurre o botão de salvar para fora da tela.

**Why this priority**: protege o critério de sucesso do produto (salvar em ≤10 s) em uma tela de celular, onde um campo de texto grande esconderia a ação principal.

**Independent Test**: digitar um texto longo, confirmar que o botão de salvar continua alcançável e que o texto chega inteiro ao Trello.

**Acceptance Scenarios**:

1. **Given** o campo de descrição, **When** o usuário digita um texto com várias linhas, **Then** o campo rola internamente e o botão de salvar continua visível.
2. **Given** um texto longo com quebras de linha, **When** o card é criado, **Then** a descrição chega ao Trello sem cortes e com as quebras preservadas.
3. **Given** um texto no limite de 2.000 caracteres, **When** o usuário tenta digitar além disso, **Then** o contador acusa o excesso e o salvamento fica bloqueado até o texto voltar ao limite.

---

### Edge Cases

- Descrição contendo apenas espaços ou quebras de linha → tratada como vazia; o card é criado normalmente.
- Descrição acima de 2.000 caracteres → o salvamento fica bloqueado com aviso e o contador indica o excesso; o texto digitado é preservado.
- Apenas a descrição preenchida, com o título vazio → o título continua obrigatório e o salvamento é recusado com a validação já existente.
- Falha ao criar o card (rede, Trello, limite) → o texto digitado NÃO pode ser perdido; o usuário precisa poder tentar de novo.
- Texto com acentos, emojis e múltiplas linhas → preservado exatamente como digitado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela de criação DEVE oferecer um campo de descrição **opcional**, inicialmente **recolhido** atrás de uma ação explícita ("adicionar descrição") que o abre.
- **FR-002**: A descrição informada DEVE ser gravada no card criado no Trello, preservando acentos, emojis, espaços e quebras de linha exatamente como digitados.
- **FR-003**: Descrição vazia (ou apenas espaços/quebras) NÃO DEVE impedir o salvamento; nesse caso o card é criado sem descrição.
- **FR-004**: A descrição NÃO DEVE substituir o título: o título continua obrigatório e sua validação não muda.
- **FR-005**: O campo DEVE aceitar no máximo **2.000 caracteres**, exibir um contador do usado sobre o limite e **bloquear o salvamento** (com aviso) enquanto o limite estiver ultrapassado.
- **FR-006**: O texto digitado NÃO DEVE ser perdido quando o salvamento falhar; o usuário tenta de novo sem redigitar.
- **FR-007**: Após um salvamento bem-sucedido, o formulário DEVE ser limpo por completo, incluindo a descrição.
- **FR-008**: A descrição DEVE existir apenas na criação do card; editar cards existentes permanece fora de escopo.
- **FR-009**: Os demais campos (título, prioridade, board) e o tempo de salvar um card simples DEVEM permanecer inalterados.

### Key Entities

- **Card**: passa a ter, além de título, prioridade e board, uma **descrição** opcional (texto livre).
- **Descrição**: texto opcional informado pelo usuário no momento da criação; viaja junto do card.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos cards criados com descrição chegam ao Trello com o texto idêntico ao digitado (sem cortes nem alteração de quebras de linha).
- **SC-002**: O salvamento de um card simples continua em ≤10 s — o campo novo acrescenta **0 campos obrigatórios**.
- **SC-003**: Com um texto longo, o botão de salvar permanece alcançável em uma tela de celular (viewport de teste).
- **SC-004**: 0% de perda do texto digitado quando o salvamento falha.

## Assumptions

- A descrição é **texto simples**: nesta versão não há atalhos de formatação nem pré-visualização (a formatação que o Trello interpreta fica para depois).
- A descrição existe **somente na criação**; edição de cards existentes continua fora de escopo.
- O card "simples" (título + prioridade, ≤10 s) continua possível sem tocar no campo de descrição.
- A regra **R4** do `docs/RULES.md` ("nesta versão não há campo descrição") é **revogada** por esta feature.
- Sem banco de dados e sem novas dependências externas.
