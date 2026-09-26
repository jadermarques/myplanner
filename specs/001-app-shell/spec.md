# Feature Specification: Base mínima do app (shell PWA)

**Feature Branch**: `001-app-shell`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Quero a base mínima do MyPlanner funcionando de ponta a ponta no ambiente de desenvolvimento local. Ao abrir o endereço no navegador do celular, vejo uma tela inicial estilo app com um único ícone grande chamado 'Inserir card' (ainda sem ação) e, no rodapé, a versão atual do app lida do arquivo VERSION. Se o aparelho estiver sem internet, a tela informa claramente que o app precisa de conexão. O backend expõe uma verificação de saúde pública e um endpoint de versão. O app deve ser instalável na tela inicial do celular (PWA). Fora de escopo: login, Trello, deploy."

## Clarifications

### Session 2026-09-25

- Q: Como tratar o endpoint de versão em relação à regra S1 (autenticação obrigatória em todos os endpoints, exceto `GET /health`), considerando que login está fora de escopo nesta feature? → A: O endpoint de versão fica público nesta feature como exceção temporária à S1, documentada; a S1 passa a valer quando a feature de login entrar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a tela inicial com o ícone "Inserir card" e a versão (Priority: P1)

Como usuário único do app, ao abrir o endereço do MyPlanner no navegador do celular, quero ver imediatamente uma tela inicial no estilo de app, com um único ícone grande chamado "Inserir card" e, no rodapé, a versão atual do app — para saber que o app carregou e que estou na tela certa.

**Why this priority**: É a base sobre a qual todas as funcionalidades futuras serão construídas. Sem uma tela inicial carregando de ponta a ponta, nenhuma outra feature (incluindo inserir card) faz sentido. É o primeiro "olá" do produto.

**Independent Test**: Pode ser testado de forma independente abrindo o endereço do app no navegador do celular (rede local) e confirmando que a tela inicial aparece com o ícone e a versão — entrega valor como ponto de partida demonstrável do MVP.

**Acceptance Scenarios**:

1. **Given** o app está em execução no ambiente local, **When** o usuário abre o endereço no navegador do celular, **Then** vê uma tela inicial no estilo de app contendo um único ícone grande chamado "Inserir card".
2. **Given** a tela inicial carregou, **When** o usuário observa o rodapé, **Then** vê a versão atual do app, idêntica à versão registrada no arquivo VERSION.
3. **Given** a tela inicial carregou, **When** o usuário toca no ícone "Inserir card", **Then** nenhuma ação é executada (o ícone ainda não tem função nesta versão).

---

### User Story 2 - Aviso claro quando sem conexão (Priority: P2)

Como usuário único, se o aparelho estiver sem internet ao abrir o app, quero ver uma mensagem clara informando que o app precisa de conexão — em vez de uma tela em branco ou um erro confuso.

**Why this priority**: O app depende de conexão (o funcionamento offline é um não objetivo declarado do produto). Informar isso de forma clara evita frustração e é essencial para a confiança no app.

**Independent Test**: Pode ser testado de forma independente desconectando a internet do celular e abrindo o app: deve aparecer uma mensagem clara de que é preciso conexão.

**Acceptance Scenarios**:

1. **Given** o aparelho está sem internet, **When** o usuário abre o app, **Then** a tela informa claramente que o app precisa de conexão.
2. **Given** o aparelho estava sem internet e exibia o aviso, **When** a conexão é restabelecida, **Then** o app passa a exibir a tela inicial normalmente (sem o aviso).

---

### User Story 3 - Instalar o app na tela inicial (PWA) (Priority: P3)

Como usuário único, quero instalar o MyPlanner na tela inicial do celular e abri-lo como um app, sem precisar digitar o endereço toda vez.

**Why this priority**: O app é mobile-first e o objetivo é abrir em segundos. Ser instalável (PWA) é parte do critério de sucesso do produto, mas só faz sentido depois que a tela inicial e o aviso de offline existem.

**Independent Test**: Pode ser testado de forma independente abrindo o app em um navegador móvel compatível e usando "Adicionar à tela inicial": o app aparece como ícone e abre a mesma tela inicial.

**Acceptance Scenarios**:

1. **Given** o app está aberto em um navegador móvel compatível, **When** o usuário escolhe "Adicionar à tela inicial", **Then** o app é instalado e aparece como um ícone na tela inicial do celular.
2. **Given** o app foi instalado, **When** o usuário abre o ícone na tela inicial, **Then** vê a tela inicial do app (a mesma do navegador).

---

### Edge Cases

- O que acontece quando o backend está fora do ar (mas o aparelho tem internet)? O app deve exibir uma mensagem de erro acionável, sem tela em branco.
- O que acontece quando o arquivo VERSION está ausente ou ilegível? O app deve se comportar de forma controlada (ex.: exibir versão "desconhecida"), sem travar.
- O que acontece em navegadores móveis sem suporte a instalação de PWA? O app permanece acessível pelo navegador; apenas a instalação não está disponível.
- O que acontece no primeiro acesso (sem cache) versus acessos seguintes? O comportamento de aviso de offline deve continuar coerente em ambos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O app DEVE exibir uma tela inicial de view única (sem navegação do navegador, modo standalone) com um único ícone central chamado "Inserir card", com área de toque de pelo menos 48×48 px e nome acessível "Inserir card".
- **FR-002**: O ícone "Inserir card" NÃO DEVE executar nenhuma ação nesta versão e DEVE indicar visualmente que ainda não está disponível (ex.: selo "em breve").
- **FR-003**: O rodapé da tela DEVE exibir a versão atual do app.
- **FR-004**: A versão exibida no rodapé DEVE corresponder à fonte única de versão do projeto (o arquivo VERSION), sem duplicação de versão em outro lugar.
- **FR-005**: O backend DEVE expor uma verificação de saúde pública (acessível sem autenticação) que indica se o app está operacional.
- **FR-006**: O backend DEVE expor a versão atual do app em um endpoint de versão público nesta feature (exceção temporária à regra S1, válida enquanto login estiver fora de escopo), lida da mesma fonte única (arquivo VERSION).
- **FR-007**: Quando o aparelho está sem internet, o app DEVE exibir, em destaque (banner no topo), a mensagem "Você precisa de conexão para usar o app." — nunca uma tela em branco.
- **FR-008**: O app DEVE ser instalável na tela inicial do celular (PWA) e abrir como app.
- **FR-009**: Durante o carregamento inicial, o app DEVE exibir um indicador de carregamento breve; nunca uma tela em branco.

### Key Entities *(include if feature involves data)*

- **Versão do app**: identificador único da versão em execução (formato SemVer `0.x.y`), com fonte única no arquivo VERSION. Não há entidades de domínio persistidas nesta versão (sem banco de dados).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário abre o endereço no celular e vê a tela inicial (ícone + versão) sem erro, em até 3 segundos em rede local.
- **SC-002**: Em 100% dos casos em que o aparelho está sem internet, o app exibe uma mensagem clara de que precisa de conexão (nunca uma tela em branco ou erro confuso).
- **SC-003**: O app pode ser instalado na tela inicial e aberto como PWA em navegador móvel compatível.
- **SC-004**: A versão exibida no rodapé é sempre idêntica à versão do arquivo VERSION (fonte única).

## Assumptions

- Login/autenticação está fora de escopo nesta feature; não há autenticação ainda, portanto os endpoints de saúde e de versão são públicos. A exigência de autenticação em todos os endpoints (regra S1) será aplicada quando a feature de login entrar no escopo.
- Integração com o Trello está fora de escopo nesta feature.
- Deploy/produção está fora de escopo; o alvo é o ambiente de desenvolvimento local.
- O app é usado por um único usuário (o dono), acessado pelo navegador do celular na rede local.
- A versão tem como fonte única o arquivo VERSION (regra O4), exibida no rodapé e exposta pelo backend.
- A instalação como PWA depende do suporte do navegador móvel (ex.: Android Chrome, iOS Safari moderno); em navegadores sem suporte, o app continua acessível pelo navegador.
