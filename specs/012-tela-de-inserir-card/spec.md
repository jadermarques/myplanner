# Feature Specification: Ajustes na tela de inserir card (descrição e confirmação)

**Feature Branch**: `012-tela-de-inserir-card`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "quero fazer alguns ajustes na tela do inserir card" — itens **#2** (descrição)
e **#7** (confirmação ao salvar) da lista do dono. Os demais itens da lista viraram as features **013**
(prioridade por campo personalizado + demais campos personalizados) e **014** (datas e lembrete).

## Clarifications

### Session 2026-09-27 — decidido com o dono

- Q: O que aparece quando a descrição está **recolhida** e já tem texto? → A: um **resumo de até 2 linhas**
  do texto digitado; tocar nele reabre para editar.
- Q: O que faz o botão "voltar"? → A: **recolhe** a descrição **preservando** o texto (que vira o resumo).
- Q: O que faz o botão "limpar"? → A: **zera** o texto e volta ao atalho "adicionar descrição".
- Q: O "+" já existe? → A: sim, mas o **alvo de toque é pequeno demais** no celular; o atalho de descrição
  deve ter um alvo maior, fácil de acertar, com um ícone "+" explícito.
- Q: A confirmação ao salvar é sempre? → A: **sim**, em todo salvamento. O dono aceitou o tempo extra; o
  critério do produto (≤10 s por card) foi **relaxado por decisão dele** nesta tela.
- Q: O que o diálogo de confirmação mostra? → A: o **título** do card (a "tarefa xxx") e o **board**.
  "Cancelar" mantém o formulário como está; "Confirmar" salva.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Controlar a descrição sem errar o toque (Priority: P1)

Como usuário único, quero abrir a descrição com um alvo grande de acertar e, depois de aberta, poder
**limpar** o que digitei ou **voltar** mantendo o texto — que deve continuar visível como resumo.

**Why this priority**: é o ajuste que o dono sentiu no uso real (o atalho "fica pequeno demais" no
celular) e não depende de nada além da interface.

**Independent Test**: digitar uma descrição, voltar, e conferir que o resumo aparece; limpar, e conferir
que o atalho volta ao estado inicial.

**Acceptance Scenarios**:

1. **Given** a tela de inserir card, **When** o usuário toca em "adicionar descrição", **Then** o alvo tem
   área de toque confortável (≥48px) e um ícone "+" visível, e a textarea abre.
2. **Given** a descrição aberta com texto digitado, **When** o usuário toca em **"voltar"**, **Then** a
   textarea recolhe e o **resumo (2 linhas)** do texto aparece no lugar do atalho.
3. **Given** a descrição recolhida com resumo, **When** o usuário toca no resumo, **Then** reabre com o
   texto **intacto** para continuar editando.
4. **Given** a descrição aberta com texto, **When** o usuário toca em **"limpar"**, **Then** o texto é
   apagado e o atalho "adicionar descrição" volta.
5. **Given** uma descrição com resumo, **When** o usuário salva, **Then** a descrição completa é enviada
   ao card (não só as 2 linhas).

---

### User Story 2 - Confirmar antes de criar o card (Priority: P1)

Como usuário único, quero confirmar a inserção antes de ela acontecer, para não criar card por engano.

**Why this priority**: pedido explícito do dono; é a rede de segurança da captura.

**Independent Test**: preencher um título, tocar em Salvar, ver o diálogo com o título e o board, cancelar
(nada criado) e, depois, confirmar (card criado).

**Acceptance Scenarios**:

1. **Given** um título preenchido, **When** o usuário toca em **Salvar**, **Then** aparece o diálogo de
   confirmação com o **título** e o **board**, em vez de salvar direto.
2. **Given** o diálogo aberto, **When** o usuário escolhe **Cancelar**, **Then** nada é criado e o
   formulário continua preenchido.
3. **Given** o diálogo aberto, **When** o usuário escolhe **Confirmar**, **Then** o card é criado (e o
   comportamento pós-salvar continua igual: aviso, limpeza do título/descrição e foco no título).
4. **Given** um card confirmado e criado, **When** o usuário já confirmou, **Then** o diálogo não aparece
   de novo para o mesmo envio.

### Edge Cases

- Descrição com texto maior que as 2 linhas do resumo: o resumo trunca com reticências e não empurra os
  outros campos.
- Descrição vazia ao voltar: não mostra resumo; volta ao atalho "adicionar descrição".
- Título vazio ao tocar Salvar: a validação atual ("O título é obrigatório.") acontece **antes** do
  diálogo — não confirma algo inválido.
- Descrição acima do limite (2000): o erro atual é mostrado **antes** do diálogo (não confirma o que
  falharia).
- Tocar Salvar repetidamente durante o envio: não abre dois diálogos nem cria dois cards.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O atalho "adicionar descrição" DEVE ter **alvo de toque ≥ 48 px** e um **ícone "+"** visível.
- **FR-002**: Com texto digitado e descrição **recolhida**, DEVE aparecer um **resumo de até 2 linhas**
  (truncado com reticências) no lugar do atalho.
- **FR-003**: Com a descrição **aberta**, DEVEM existir **"voltar"** (recolhe preservando o texto) e
  **"limpar"** (zera o texto).
- **FR-004**: O valor enviado ao card DEVE ser **sempre o texto completo** — nunca o resumo.
- **FR-005**: Sem texto, DEVE permanecer o atalho "adicionar descrição" (nenhum resumo).
- **FR-006**: Tocar em **Salvar** DEVE exigir **confirmação sempre**, com o diálogo mostrando o **título**
  e o **board**.
- **FR-007**: **Cancelar** NÃO DEVE criar card nem alterar o formulário; **Confirmar** DEVE criar o card.
- **FR-008**: As validações existentes (título obrigatório; descrição ≤ 2000) DEVEM acontecer **antes** do
  diálogo — nunca confirmar algo inválido.
- **FR-009**: Um envio NÃO DEVE abrir dois diálogos nem criar dois cards (botão desabilitado durante o
  envio).
- **FR-010**: O comportamento pós-salvar NÃO DEVE mudar: aviso "Card criado!", limpeza de título e
  descrição, foco de volta ao título.
- **FR-011**: "voltar" e "limpar" DEVEM ter alvo ≥ 48 px e nomes acessíveis; o diálogo DEVE ser navegável
  por teclado/leitor de tela.
- **FR-012**: Nada fora do escopo muda: prioridade, etiquetas, lista e descrição-envio permanecem como
  estão (a prioridade é assunto da 013).

### Key Entities

- **Descrição**: texto opcional de até 2000 caracteres; agora com três estados visuais — *fechada*
  (atalho), *fechada com resumo* (2 linhas) e *aberta* (textarea + voltar/limpar).
- **Diálogo de confirmação**: sobreposição que mostra título + board, com Cancelar/Confirmar, antes de
  criar o card.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O atalho e os botões "voltar"/"limpar" têm alvo ≥ 48 px.
- **SC-002**: digitar → voltar → resumo (2 linhas) → reabrir → **0 perda de texto**.
- **SC-003**: limpar → texto zerado e atalho restaurado.
- **SC-004**: Salvar sem confirmar cria **0** cards; confirmar cria **exatamente 1**.
- **SC-005**: Cancelar preserva título, descrição, prioridade, etiquetas e lista.
- **SC-006**: **0** regressões nas suítes (unidade + E2E) e no fluxo de captura existente.

## Assumptions

- É uma mudança **só de frontend** (a confirmação é do lado do cliente); **nenhuma** alteração de API ou
  de backend nesta feature.
- O resumo é **truncamento visual** (CSS, 2 linhas); o texto completo permanece no estado e é o que viaja
  para o servidor.
- O diálogo é um modal da própria interface (não `window.confirm`), para manter o tema escuro/mobile e a
  acessibilidade.
- A prioridade, as etiquetas e a lista continuam funcionando como hoje até a feature 013 assumi-las.

