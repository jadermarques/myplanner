# Feature Specification: Aparelhos e TOTP

**Feature Branch**: `004-dispositivos`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Registro de novos aparelhos com TOTP (app autenticador) e gerenciamento de aparelhos conectados (lista e revogação individual)."

## Clarifications

### Session 2026-09-25

- Q: Como identificar e nomear um aparelho? → A: cookie de aparelho gerado pelo servidor + nome derivado do User-Agent (ex.: "Chrome no Android").
- Q: Como configurar o segredo TOTP? → A: segredo fixo no `.env` (`APP_TOTP_SECRET`); sem UI/QR nesta versão.
- Q: Aparelho revogado precisa de TOTP de novo? → A: sim — é tratado como aparelho novo (senha + TOTP).
- Q: Tolerância da janela do TOTP? → A: ±1 período (30 s).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar um novo aparelho com TOTP (Priority: P1)

Como usuário único, ao entrar de um aparelho novo, além da senha informo o código do meu app autenticador (TOTP); depois, esse aparelho fica registrado e os próximos acessos dele não pedem TOTP.

**Why this priority**: É a regra S4 — exige um segundo fator só no primeiro acesso de cada aparelho. Aumenta muito a segurança sem atrapalhar o uso diário.

**Independent Test**: Pode ser testado de forma independente logando de um aparelho sem registro: deve exigir o código TOTP; após informar um código válido, entra e o aparelho fica registrado.

**Acceptance Scenarios**:

1. **Given** a senha está correta em um aparelho não registrado, **When** o usuário informa um código TOTP válido, **Then** o aparelho é registrado e ele entra no app.
2. **Given** um código TOTP inválido ou expirado, **When** o usuário tenta, **Then** recebe erro e não entra.
3. **Given** um aparelho já registrado, **When** o usuário faz login, **Then** o TOTP NÃO é exigido (somente a senha).

---

### User Story 2 - Ver os aparelhos conectados (Priority: P2)

Como usuário único, vejo a lista dos aparelhos registrados, com uma identificação e o último uso de cada um.

**Why this priority**: Dá visibilidade de onde a conta está logada, base para revogar acessos indevidos.

**Independent Test**: Pode ser testado de forma independente abrindo a lista de aparelhos e confirmando que o aparelho atual aparece.

**Acceptance Scenarios**:

1. **Given** há aparelhos registrados, **When** o usuário abre a lista, **Then** vê cada aparelho com identificação e último uso.

---

### User Story 3 - Revogar um aparelho (Priority: P3)

Como usuário único, revogo um aparelho específico; ele deixa de ter acesso até ser registrado de novo (com TOTP).

**Why this priority**: Permite cortar o acesso de um aparelho perdido/roubado.

**Independent Test**: Pode ser testado de forma independente revogando um aparelho e confirmando que ele não consegue mais acessar.

**Acceptance Scenarios**:

1. **Given** a lista de aparelhos, **When** o usuário revoga um aparelho, **Then** ele é removido e sua sessão deixa de valer.

---

### Edge Cases

- Código TOTP expirado/inválido → erro, sem registrar o aparelho.
- Aparelho revogado tentando usar a sessão → `401` e nova exigência de TOTP.
- Sem `APP_TOTP_SECRET` configurado → o registro de novo aparelho deve falhar de forma controlada (mensagem clara).
- Relógio do servidor fora de sincronia → tolerância de janela do TOTP.
- Revogar o próprio aparelho atual → a sessão atual também é encerrada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O TOTP (app autenticador) DEVE ser exigido apenas ao registrar um novo aparelho; aparelhos já registrados entram só com a senha (regra S4).
- **FR-002**: O segredo TOTP DEVE existir somente no servidor (`APP_TOTP_SECRET` em `.env`) (regra S9).
- **FR-003**: Cada aparelho DEVE ser identificado por um identificador persistente gerado pelo servidor (cookie), criado no registro.
- **FR-004**: O backend DEVE expor a lista de aparelhos registrados; o nome é derivado do User-Agent no formato `<Navegador> no <SO>` (ex.: "Chrome no Android"), com o último uso.
- **FR-005**: O usuário DEVE poder revogar um aparelho individualmente.
- **FR-006**: Um aparelho revogado DEVE perder a sessão (suas requisições passam a `401`) e, ao voltar, DEVE ser tratado como aparelho novo (senha + TOTP).
- **FR-007**: O código TOTP DEVE validar com tolerância de ±1 período (30 s).
- **FR-008**: Logs NUNCA DEVEM registrar senha, código TOTP, segredo ou cookie (regra S8).

### Key Entities *(include if feature involves data)*

- **Aparelho**: identificador (id persistente), identificação amigável, data de registro, último uso.
- **Segredo TOTP**: valor base32 em `APP_TOTP_SECRET` (servidor).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos logins de aparelhos não registrados exigem TOTP; 0% dos aparelhos registrados exigem.
- **SC-002**: A lista de aparelhos exibe todos os aparelhos registrados com identificação.
- **SC-003**: Um aparelho revogado recebe `401` na próxima requisição autenticada.

## Assumptions

- O segredo TOTP é fixo no `.env` (`APP_TOTP_SECRET`, base32) — sem fluxo de UI/QR; o dono o adiciona manualmente no app autenticador.
- Os aparelhos são identificados por um cookie persistente gerado pelo servidor, criado no primeiro registro; o nome exibido é derivado do User-Agent.
- Sem banco de dados: aparelhos guardados em arquivo de estado gitignorado (como o hash da senha).
- O login por senha (feature 003) já existe; esta feature acrescenta o passo TOTP apenas para aparelhos novos.
