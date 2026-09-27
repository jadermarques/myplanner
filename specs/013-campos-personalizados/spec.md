# Feature Specification: Prioridade e campos personalizados do board

**Feature Branch**: `013-campos-personalizados`

**Created**: 2026-09-27

**Status**: Draft

**Input**: Itens **#1** (prioridade) e **#6** (campos personalizados) da lista de ajustes do dono. A **R3**
será emendada nesta feature. Ver `docs/adr/0005-acesso-por-rede-privada.md` para o contexto de verificação
de API feita antes (o research D8 e o script `trello_inspect.py` confirmaram os endpoints e tipos).

## Clarifications

### Session 2026-09-27 — decidido com o dono

- **Prioridade**: vira um **combobox** (mesmo padrão da Lista de destino), **escolha única**; o estado
  **vazio** significa "sem prioridade" e **não** é listado como opção; os **valores vêm do campo
  personalizado `Prioridade`** (lista) do board; o campo só aparece **se o board tiver** esse campo.
- **Depois de escolher**, existe um **"limpar"** discreto para voltar ao estado vazio (igual às etiquetas).
- **A prioridade deixa de ser etiqueta**: o app deixa de aplicar as etiquetas "Muito alta/Alta/Média/
  Baixa/Muito baixa" e deixa de **filtrá-las** da lista de etiquetas do board. As **etiquetas** continuam
  existindo como campo independente (com as etiquetas reais do board).
- **Campos personalizados** do board: renderizados **abaixo dos campos padrão**, cada um pelo seu **tipo**
  (lista → combobox; data → campo de data; checkbox → caixa; número → campo numérico; texto → campo de
  texto), usando os **valores e cores** definidos no Trello.
- **"Regras"** = **tipo + valores** (a API do Trello não expõe validação extra, como mínimo/máximo de
  número ou obrigatoriedade — decisão do dono: isso basta).
- **Gravação em dois passos**: a API não aceita campo personalizado na **criação** do card. O app cria o
  card e **depois** grava cada campo. Se um campo falhar, o card **já existe** e o app **avisa** — nunca
  bloqueia a captura (mesma filosofia da R7/R8).
- **Sem campos personalizados no board** → a seção inteira **não aparece** (mesmo padrão de etiqueta/lista).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prioridade como combobox, vinda do campo personalizado (Priority: P1)

Como usuário único, quero que a prioridade seja uma **lista fechada** (um toque = uma escolha), alimentada
pelo **campo personalizado "Prioridade"** do board, para a prioridade aparecer no Trello como campo (não
como etiqueta) e sem eu digitar nada.

**Independent Test**: num board com o campo "Prioridade", escolher um valor e conferir que o card sai com
o campo personalizado preenchido (não com etiqueta).

**Acceptance Scenarios**:

1. **Given** um board com o campo personalizado "Prioridade", **When** o usuário abre a tela, **Then** a
   Prioridade é um combobox com as opções do campo (com as cores), **sem** a opção "Sem prioridade".
2. **Given** o combobox aberto, **When** o usuário escolhe uma opção, **Then** só uma fica marcada.
3. **Given** uma opção escolhida, **When** o usuário toca em **"limpar"**, **Then** volta ao estado vazio
   ("sem prioridade").
4. **Given** um board **sem** o campo "Prioridade", **When** o usuário abre a tela, **Then** a Prioridade
   **não aparece**.
5. **Given** uma prioridade escolhida, **When** o card é salvo, **Then** o valor vai para o **campo
   personalizado** do card (não para uma etiqueta).

---

### User Story 2 - Campos personalizados do board na captura (Priority: P1)

Como usuário único, quero preencher os **campos personalizados** do board direto na tela de inserir card,
com os **mesmos tipos e valores** que defini no Trello.

**Independent Test**: num board com campos de tipos variados, renderizar cada um e salvar o card com os
valores preenchidos.

**Acceptance Scenarios**:

1. **Given** um board com campos personalizados, **When** o usuário abre a tela, **Then** cada campo
   aparece **abaixo dos campos padrão**, no seu tipo (lista/data/checkbox/número/texto).
2. **Given** um campo do tipo lista, **When** o usuário interage, **Then** as opções e cores são as
   definidas no Trello.
3. **Given** valores preenchidos, **When** o card é salvo, **Then** os valores são gravados nos respectivos
   campos do card.
4. **Given** um campo cuja gravação falha, **When** o card é salvo, **Then** o card **é criado mesmo
   assim** e o app avisa qual campo não foi aplicado.
5. **Given** um board **sem** campos personalizados, **When** o usuário abre a tela, **Then** a seção
   **não aparece**.

### Edge Cases

- Campo "Prioridade" inexistente mas com outros campos personalizados: a Prioridade some e os demais
  aparecem.
- Valor de prioridade que deixou de existir no campo (apagado no Trello): ignorado na gravação, sem erro.
- Campo número com valor inválido (não numérico): o navegador/validação bloqueia antes de enviar.
- Muitos campos: a tela continua rolável e a barra de Salvar alcançável.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A Prioridade DEVE ser um **combobox de escolha única**, cuja lista **não** contém "Sem
  prioridade"; o estado **vazio** representa "sem prioridade".
- **FR-002**: Os valores da Prioridade DEVEM vir do campo personalizado **"Prioridade"** (tipo lista) do
  board, com as **cores** de cada opção.
- **FR-003**: A Prioridade DEVE aparecer **somente** se o board tiver o campo personalizado "Prioridade".
- **FR-004**: DEVE existir **"limpar"** para voltar a "sem prioridade" depois de escolher.
- **FR-005**: A prioridade DEVE ser gravada como **valor do campo personalizado** (nunca como etiqueta).
- **FR-006**: Os campos personalizados do board DEVEM aparecer **abaixo dos campos padrão**, cada um no
  seu tipo (lista → combobox; data → data; checkbox → caixa; número → numérico; texto → texto).
- **FR-007**: Cada campo DEVE usar os **valores e cores** definidos no Trello.
- **FR-008**: Sem campos personalizados no board, a seção DEVE **não aparecer**.
- **FR-009**: A gravação dos campos DEVE ser feita **após criar o card**, em modo **best-effort**: a falha
  de um campo NÃO bloqueia a captura e DEVE avisar qual campo não foi aplicado.
- **FR-010**: Prioridade e campos DEVEM ser **validados no servidor** contra o que o board realmente tem
  (um valor que sumiu é ignorado, nunca 400).
- **FR-011**: A lista de **etiquetas** DEVE deixar de excluir os nomes de prioridade — a prioridade não é
  mais etiqueta.
- **FR-012**: Nada de data/lembrete entra aqui (assunto da 014).

### Key Entities

- **Campo personalizado**: definição do board (id, nome, tipo, opções com valor + cor).
- **Prioridade**: passa de "etiqueta com nome fixo" para "valor do campo personalizado `Prioridade`".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Prioridade é escolha única e a lista não mostra "Sem prioridade".
- **SC-002**: Card com prioridade escolhida sai com o **campo personalizado** preenchido.
- **SC-003**: Card sem prioridade sai **sem** o campo.
- **SC-004**: Valor que sumiu do board → card criado **mesmo assim** + aviso (**0** falha de captura).
- **SC-005**: Board sem campos → seção ausente; **0** regressões nas suítes.
- **SC-006**: **0** etiquetas de prioridade aplicadas e **0** etiquetas escondidas da lista.

## Assumptions

- O campo de prioridade é localizado pelo **nome** "Prioridade" (o id muda por board).
- Tipos suportados: **lista, data, checkbox, número, texto** (os que existem na conta).
- Sem validação extra (a API não expõe mín/máx/obrigatoriedade) — decidido com o dono.
- A emenda da **R3** acompanha esta feature (prioridade deixa de ser limitada a `priority_labels`).

