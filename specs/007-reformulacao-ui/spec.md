# Feature Specification: Reformulação da interface (captura rápida)

**Feature Branch**: `007-reformulacao-ui`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Não gostei da interface atual. Faça uma reformulação, deixando mais moderna e fácil de usar. Verifique as melhores interfaces e decida você mesmo a mais prática para o meu propósito. Explore a usabilidade e UX. Faça tudo sozinho, não me pergunte nada. Reflita e analise as melhores opções para tornar o app prático e rápido."

## Clarifications

### Session 2026-09-26 — decidido pelo agente, sem consulta (instrução explícita do dono)

- Q: Tema claro, escuro ou ambos? → A: **tema escuro único** — identidade consistente, uso típico no celular, menos superfície para manter; o `theme-color` acompanha o fundo.
- Q: Prioridade como lista suspensa (atual) ou escolha direta? → A: **escolha direta** (chips) — a lista custa 2 toques (abrir + escolher) e esconde as opções; os chips custam 1 toque e mostram tudo.
- Q: Onde fica a escolha de board? → A: num **chip no cabeçalho**, com o último usado já selecionado — o board quase nunca muda e não deve ocupar o caminho da digitação.
- Q: O que acontece com trocar senha/sair/versão? → A: vão para um **menu secundário** no cabeçalho, fora do fluxo de captura.
- Q: A descrição continua recolhida? → A: **sim** — decisão da feature 006 preservada (o card simples não pode custar mais toques).
- Q: A interface de autenticação muda? → A: **sim**, ganha a mesma linguagem visual — a experiência não deve "cair" de qualidade na primeira tela.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capturar um card com o mínimo de toques (Priority: P1)

Como usuário único, quero abrir o app e já poder digitar o título, escolher a prioridade com um toque e salvar sem procurar o botão, para lançar um card em segundos com uma mão só.

**Why this priority**: é o critério de sucesso do produto (≤10 s por card). Cada toque economizado e o posicionamento na zona do polegar valem direto no objetivo principal.

**Independent Test**: abrir o app autenticado, digitar o título sem tocar em nada antes, escolher uma prioridade com um toque e salvar — sem rolar a tela em nenhum momento.

**Acceptance Scenarios**:

1. **Given** o app autenticado, **When** a tela de captura abre, **Then** o campo de título já está pronto para digitação (nenhum toque preparatório) e o teclado é solicitado.
2. **Given** o campo de descrição expandido com um texto longo, **When** o usuário procura a ação de salvar, **Then** ela permanece visível e alcançável com o polegar.
3. **Given** a tela de captura, **When** o usuário toca uma prioridade, **Then** ela é selecionada imediatamente, sem seletor modal, e o board atual continua visível.
4. **Given** o teclado aberto, **When** o usuário termina de digitar, **Then** a ação de salvar continua visível acima do teclado.

---

### User Story 2 - Ver onde estou e agir sem ruído (Priority: P2)

Como usuário único, quero saber em qual board o card vai cair e ter as ações secundárias fora do caminho, para não errar o destino nem me distrair no meio da captura.

**Why this priority**: errar o board é o erro mais custoso do fluxo (o card entra no lugar errado e precisa ser corrigido depois, no Trello).

**Independent Test**: identificar o board atual e trocá-lo em um toque; encontrar trocar senha/sair sem sair da tela de captura.

**Acceptance Scenarios**:

1. **Given** a tela de captura, **When** o usuário olha a tela, **Then** o nome do board atual está visível sem interação.
2. **Given** o chip do board, **When** o usuário o toca, **Then** escolhe outro board em um toque e a escolha é lembrada no próximo acesso.
3. **Given** a tela de captura, **When** o usuário abre o menu secundário, **Then** encontra trocar senha, sair e a versão do app, sem que disputem espaço com o formulário.

---

### User Story 3 - Confirmação evidente e pronto para o próximo card (Priority: P3)

Como usuário único, quero confirmar que o card foi criado e já poder lançar o próximo sem tocar em nada.

**Why this priority**: quem captura costuma lançar vários cards seguidos; a confirmação precisa ser óbvia e o recomeço, imediato.

**Independent Test**: salvar um card e verificar que a confirmação é evidente e que o app está pronto para o próximo card.

**Acceptance Scenarios**:

1. **Given** um card salvo com sucesso, **When** a resposta chega, **Then** o usuário recebe confirmação visual clara ("Card criado!") e os campos ficam limpos.
2. **Given** o sucesso, **When** o usuário vai lançar o segundo card, **Then** o campo de título já está pronto para digitação, sem toques preparatórios.
3. **Given** uma falha ao salvar, **When** o erro é exibido, **Then** o texto digitado permanece e o motivo é legível, sem jargão técnico.

---

### Edge Cases

- **Tela muito estreita (320 px) ou muito baixa (568 px)**: nenhum texto é cortado e a ação primária continua alcançável.
- **Teclado aberto**: a barra de ação acompanha e não fica escondida atrás do teclado.
- **Notch / barra de gestos**: nenhum controle encosta nas áreas seguras do sistema.
- **Sem conexão**: o aviso aparece sem sobrepor conteúdo nem cobrir controles.
- **Texto ampliado pelo usuário (fonte grande do sistema)**: o layout continua utilizável, sem sobreposição.
- **Descrição acima do limite**: bloqueio e aviso continuam evidentes na nova linguagem visual.
- **Sem boards disponíveis ou falha ao carregá-los**: a tela informa e evita a tentativa de salvar às cegas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao abrir a tela de captura, o campo de título DEVE estar pronto para digitação imediata, sem nenhum toque preparatório.
- **FR-002**: A ação primária (salvar) DEVE permanecer visível e alcançável com o polegar — com o teclado aberto, com a descrição expandida e em telas pequenas.
- **FR-003**: Todo elemento interativo DEVE ter alvo de toque de no mínimo **48 × 48 px**, com no mínimo **8 px** de separação entre alvos vizinhos.
- **FR-004**: A prioridade DEVE ser escolhida em **um único toque**, com todas as opções visíveis simultaneamente (sem seletor modal).
- **FR-005**: O board atual DEVE estar visível sem interação e trocável em um toque, sem ocupar o caminho da digitação.
- **FR-006**: Ações secundárias (trocar senha, sair) e a versão do app NÃO DEVEM competir visualmente com a captura.
- **FR-007**: Após o sucesso, DEVE haver confirmação inequívoca ("Card criado!") e o app DEVE ficar pronto para o próximo card (campos limpos e título pronto para digitação).
- **FR-008**: Nenhum conteúdo ou controle DEVE colidir com o teclado ou com as áreas seguras do sistema.
- **FR-009**: O aviso de falta de conexão DEVE aparecer sem sobrepor conteúdo ou controles.
- **FR-010**: Os **nomes acessíveis** hoje cobertos por testes (título, board, prioridade, descrição, salvar, senha, nova senha, confirmar senha, entrar) e os papéis usados (alerta, status) DEVEM ser preservados.
- **FR-011**: A linguagem visual DEVE ser a mesma em todas as telas (captura, entrar, definir senha, trocar senha).
- **FR-012**: O app DEVE continuar operável apenas com teclado (foco visível) e respeitar a preferência de **movimento reduzido**.
- **FR-013**: Nenhuma regra de negócio, contrato de API, limite, validação ou requisito de segurança DEVE mudar nesta feature.

### Key Entities

- **Tela de captura**: a tela única do produto — cabeçalho (identidade + board + menu), formulário (título, prioridade, descrição opcional) e barra de ação fixa.
- **Ação primária**: salvar o card; sempre visível e alcançável.
- **Ações secundárias**: trocar senha, sair e a versão do app, agrupadas fora do fluxo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O card simples continua em ≤10 s **e passa a exigir 0 toques preparatórios** (hoje exige 1: tocar no campo de título).
- **SC-002**: Escolher a prioridade passa a exigir **1 toque** (hoje exige 2: abrir a lista e escolher).
- **SC-003**: **100%** dos alvos de toque medem ≥48 px, com ≥8 px de separação entre vizinhos.
- **SC-004**: Em viewport de **320 × 568** nenhum texto ou controle é cortado e a ação primária permanece alcançável.
- **SC-005**: Todo texto atinge contraste **≥ 4.5:1** sobre o fundo em que aparece.
- **SC-006**: **0** regressões nos testes existentes de comportamento (captura, validação, limite da descrição, autenticação).

## Assumptions

- A reformulação é **exclusivamente de apresentação e fluxo de interação**: nenhuma mudança de API, de regra de negócio, de validação ou de segurança.
- O tema é **escuro único**, com identidade visual própria (tipografia, cores, espaçamento e raios consistentes).
- As decisões de produto da feature 006 (descrição opcional, recolhida, limite de 2.000 caracteres) permanecem.
- Referência de ergonomia adotada: **alvos de toque ≥48 px com ~8 px de espaçamento** (web.dev, "Accessible tap targets").
- Sem novas dependências, sem banco de dados e sem serviços externos novos.

