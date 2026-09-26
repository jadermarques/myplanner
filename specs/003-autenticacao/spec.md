# Feature Specification: Autenticação do usuário único

**Feature Branch**: `003-autenticacao`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Login do usuário único: senha forte (Argon2id), sessão de 90 dias em cookie seguro, logout, bloqueio progressivo após tentativas falhas e proteção de todos os endpoints exceto /health. TOTP (registro de novo aparelho) e lista de aparelhos ficam para a próxima feature."

## Clarifications

### Session 2026-09-25

- Q: Como tratar o endpoint `/version` agora que o login entra? → A: Proteger `/version` (S1 estrita); o rodapé mostra a versão só após o login.
- Q: Qual o limiar do bloqueio progressivo? → A: 5 tentativas falhas → espera 30 s, dobrando a cada nova falha (30 s, 60 s, 120 s…); reset ao acertar.
- Q: Como a senha é definida? → A: Fluxo de UI (definir no primeiro acesso + trocar depois), armazenada como hash Argon2id.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definir a senha no primeiro acesso (Priority: P1)

Como usuário único, no primeiro acesso (sem senha definida), defino minha senha; ela é armazenada de forma segura e passo a poder fazer login.

**Why this priority**: Sem uma senha definida não há como autenticar — é o passo inicial obrigatório.

**Independent Test**: Pode ser testado de forma independente acessando o app sem senha definida e confirmando que a tela de "definir senha" aparece e salva a senha.

**Acceptance Scenarios**:

1. **Given** não há senha definida, **When** o usuário acessa o app, **Then** vê a tela de "definir senha".
2. **Given** uma senha forte digitada e confirmada, **When** o usuário salva, **Then** a senha é armazenada (hash Argon2id) e ele é autenticado.

---

### User Story 2 - Fazer login com senha e acessar o app (Priority: P1)

Como usuário único, abro o app, digito minha senha e entro; o app me mantém logado por até 90 dias sem precisar repetir a senha a cada uso.

**Why this priority**: É o que protege o app e o token do Trello de acesso não autorizado (S1). Sem login, tudo fica aberto.

**Independent Test**: Pode ser testado de forma independente logando com a senha correta e confirmando que o app carrega e que uma sessão (cookie) é criada.

**Acceptance Scenarios**:

1. **Given** a senha está correta, **When** o usuário faz login, **Then** entra no app e recebe um cookie de sessão.
2. **Given** a senha está errada, **When** o usuário tenta logar, **Then** vê a mensagem "Senha incorreta." (genérica, sem revelar detalhes) e não entra.
3. **Given** uma sessão válida, **When** o usuário usa o app, **Then** a sessão é renovada (não precisa logar de novo).

---

### User Story 3 - Trocar a senha (Priority: P2)

Como usuário único, posso trocar minha senha por uma nova.

**Why this priority**: Permite rotacionar a senha por segurança; é o complemento natural do gerenciamento de senha.

**Independent Test**: Pode ser testado de forma independente trocando a senha (informando a atual + a nova) e confirmando que a nova passa a valer.

**Acceptance Scenarios**:

1. **Given** o usuário está logado, **When** troca a senha (senha atual + nova), **Then** a nova senha é armazenada e a antiga deixa de valer.

---

### User Story 4 - Sair do app (Priority: P2)

Como usuário único, posso sair do app (logout), encerrando minha sessão.

**Why this priority**: Permite encerrar o acesso (ex.: aparelho compartilhado) e é o complemento natural do login.

**Independent Test**: Pode ser testado de forma independente tocando em "Sair" e confirmando que a sessão é revogada e o app volta à tela de login.

**Acceptance Scenarios**:

1. **Given** o usuário está logado, **When** toca em "Sair", **Then** a sessão é revogada e a tela de login é exibida.

---

### User Story 5 - Bloqueio progressivo após tentativas falhas (Priority: P3)

Como usuário único, após várias tentativas de senha erradas, o login é temporariamente bloqueado com espera progressiva.

**Why this priority**: Protege contra força bruta (S5). É requisito de segurança, mas não impede o fluxo básico.

**Independent Test**: Pode ser testado de forma independente errando a senha várias vezes e confirmando que o bloqueio progressivo é aplicado.

**Acceptance Scenarios**:

1. **Given** várias tentativas de senha errada seguidas, **When** o usuário tenta logar de novo, **Then** recebe um bloqueio progressivo (tempo de espera crescente).

---

### User Story 6 - Proteção dos endpoints (Priority: P4)

Como usuário único, sem sessão válida não é possível acessar os dados (boards, cards, versão); apenas a verificação de saúde permanece pública.

**Why this priority**: Aplica a regra S1 (autenticação obrigatória em todos os endpoints, exceto `/health`) — é o objetivo central da feature.

**Independent Test**: Pode ser testado de forma independente acessando `/boards` ou `/cards` sem sessão e confirmando o `401`.

**Acceptance Scenarios**:

1. **Given** não há sessão válida, **When** o usuário acessa `/boards` ou `/cards`, **Then** recebe `401`.
2. **Given** não há sessão válida, **When** acessa `GET /health`, **Then** recebe `200` (público).

---

### Edge Cases

- Senha errada não revela se o usuário existe (mensagem genérica).
- Sessão expirada (após 90 dias sem uso) → redirecionar ao login.
- Cookie ausente, adulterado ou inválido → `401`.
- CSRF token ausente ou inválido em mutação (POST) → `403`.
- Muitas tentativas falhas → bloqueio progressivo (espera crescente).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A senha do usuário único DEVE ser armazenada como hash Argon2id (regra S2).
- **FR-002**: A sessão DEVE durar 90 dias, renovada a cada uso, em cookie `HttpOnly`, `Secure` e `SameSite=Strict` (regra S3).
- **FR-003**: O logout DEVE revogar a sessão.
- **FR-004**: DEVE haver bloqueio progressivo: 5 tentativas falhas → espera de 30 s, dobrando a cada nova falha (30 s, 60 s, 120 s…); reset ao acertar (regra S5).
- **FR-005**: Todos os endpoints DEVEM exigir autenticação (incluindo `/version`), exceto `GET /health` (regra S1).
- **FR-006**: DEVE haver proteção CSRF e cabeçalhos de segurança (CSP, HSTS) em todas as respostas (regra S6).
- **FR-007**: Segredos (hash da senha, `SESSION_SECRET`) DEVEM existir somente em `.env` (regra S9).
- **FR-008**: Logs NUNCA DEVEM registrar senha, token, segredo ou cookie em texto plano (regra S8).
- **FR-009**: O app DEVE permitir definir a senha no primeiro acesso (quando não há senha), com no mínimo 8 caracteres, armazenada como hash Argon2id.
- **FR-010**: O app DEVE permitir trocar a senha (informando a senha atual).

### Key Entities *(include if feature involves data)*

- **Usuário (único)**: senha (armazenada como hash Argon2id).
- **Sessão**: cookie seguro (`HttpOnly`/`Secure`/`SameSite=Strict`), duração de 90 dias, renovada a cada uso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O login é concluído em poucos segundos (≤ 3 s em rede local).
- **SC-002**: A sessão persiste por 90 dias, renovada a cada uso.
- **SC-003**: 100% dos endpoints protegidos (exceto `GET /health`) retornam `401` sem sessão válida.
- **SC-004**: Após um número definido de tentativas falhas, o login é bloqueado com espera progressiva.

## Assumptions

- TOTP (registro de novo aparelho) e lista/revogação de aparelhos ficam para a próxima feature (`004-dispositivos`); nesta feature o login é por senha apenas.
- HTTPS (regra S7) é item de deploy, fora desta feature (o alvo é o ambiente de desenvolvimento local).
- Usuário único; o hash da senha e o `SESSION_SECRET` ficam em `.env` (`APP_PASSWORD_HASH`, `SESSION_SECRET`).
- A senha é definida via UI no primeiro acesso (e trocada via UI); o mecanismo de armazenamento do hash Argon2id é definido no plan (ex.: arquivo de estado gitignorado).
