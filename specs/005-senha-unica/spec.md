# Feature Specification: Autenticação somente por senha (remoção de aparelhos e TOTP)

**Feature Branch**: `005-senha-unica`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Retirar a funcionalidade de permitir/gerenciar aparelhos: pedir apenas uma senha e liberar. A segurança passa a ser somente a senha."

## Clarifications

### Session 2026-09-26

- Q: O bloqueio progressivo por tentativas de senha erradas deve continuar ativo? → A: não — a segurança será somente a senha, sem nenhum bloqueio.
- Q: Os artefatos da spec 004 (spec/plan/tasks/checklists/ADR 0003) devem permanecer? → A: sim, mantidos como registro histórico, marcados como superados.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar informando apenas a senha (Priority: P1)

Como usuário único, quero entrar informando apenas a minha senha, em qualquer dispositivo, sem nenhum passo adicional de verificação ou de configuração.

**Why this priority**: é o objetivo da mudança — reduzir o acesso ao mínimo de atrito, mantendo a proteção por senha. Sem isso a mudança não entrega valor.

**Independent Test**: em um dispositivo nunca usado, informar a senha correta concede acesso imediatamente, sem qualquer pedido de código.

**Acceptance Scenarios**:

1. **Given** a senha está definida e o dispositivo nunca acessou o app, **When** o usuário informa a senha correta, **Then** entra imediatamente, sem pedido de código adicional.
2. **Given** o primeiro uso do app (nenhuma senha definida), **When** o usuário define uma senha válida, **Then** a senha é gravada e ele já entra, sem pedido de código adicional.
3. **Given** uma senha incorreta, **When** o usuário tenta entrar, **Then** recebe erro e não entra.

---

### User Story 2 - Não encontrar nenhum vestígio de aparelhos (Priority: P2)

Como usuário único, não quero ver tela, campo, botão ou texto sobre aparelhos, códigos de autenticador ou revogação.

**Why this priority**: a funcionalidade foi retirada; sobras confundem o usuário e sugerem uma proteção que não existe mais.

**Independent Test**: percorrer todas as telas do app não revela nada relacionado a aparelhos, autenticador ou revogação.

**Acceptance Scenarios**:

1. **Given** o app em uso, **When** o usuário navega pelas telas disponíveis, **Then** não existe lista de aparelhos, identificação de aparelho, botão de revogação nem campo de código.
2. **Given** uma instalação nova, **When** o app é colocado no ar, **Then** entrar exige a senha e nada mais.

---

### Edge Cases

- **Sessão em andamento quando a mudança entra no ar**: continua válida até expirar — ninguém é deslogado pela mudança.
- **Dispositivo com registro antigo da versão anterior**: o resquício é ignorado; não concede nem nega acesso.
- **Senha esquecida**: comportamento inalterado (só é possível definir senha quando nenhuma existe).
- **Tentativas repetidas de senha errada**: não há bloqueio nem atraso — cada tentativa é avaliada de forma independente (decisão consciente do dono).
- **Instalação sem nenhuma configuração extra de segurança**: o app deve funcionar sem exigir qualquer segredo adicional do dono.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O acesso ao app DEVE exigir somente a senha do usuário; nenhum segundo fator, código ou aprovação de dispositivo.
- **FR-002**: O app NÃO DEVE exigir nenhum segredo de autenticador para entrar, nem durante a instalação.
- **FR-003**: O app NÃO DEVE manter nem exibir lista de dispositivos, identificação de dispositivo ou revogação individual.
- **FR-004**: O app NÃO DEVE bloquear, atrasar nem limitar tentativas de login por senha errada; cada tentativa é avaliada de forma independente.
- **FR-005**: A sessão autenticada DEVE continuar durando 90 dias e sendo renovada a cada uso.
- **FR-006**: O app DEVE funcionar por completo sem exigir qualquer configuração adicional de segurança além da senha.
- **FR-007**: As sessões válidas no momento da mudança NÃO DEVEM ser invalidadas.
- **FR-008**: Logs NUNCA DEVEM registrar senha, segredo, cookie ou dados pessoais (S8).
- **FR-009**: Nenhum resquício das funcionalidades removidas DEVE permanecer na interface nem na documentação do produto (o histórico do repositório é preservado como registro).
- **FR-010**: Nenhum dado residual da funcionalidade removida DEVE influenciar o acesso ao app (nem conceder, nem negar, nem condicionar).

### Key Entities

- **Senha do usuário único**: credencial de acesso; passa a ser a única forma de autenticação.
- *(removidas nesta feature)* **Dispositivo** e **Segredo de autenticador**.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos acessos são concedidos exclusivamente por senha; 0 solicitações de segundo fator em qualquer dispositivo.
- **SC-002**: O primeiro acesso em um dispositivo novo exige 0 passos de configuração prévia.
- **SC-003**: 0 telas, campos, botões ou textos sobre dispositivos, autenticador ou revogação permanecem no app.
- **SC-004**: 100% das sessões válidas antes da mudança continuam válidas depois dela.

## Assumptions

- A decisão de reduzir a autenticação à senha é consciente e fica registrada em ADR; as
  proteções remanescentes são a **força da senha**, o **transporte seguro (HTTPS)** e o
  cookie de sessão `HttpOnly`/`Secure`/`SameSite=Strict`. O segundo fator e o bloqueio por
  tentativas são removidos por decisão explícita do dono, que assume o risco.
- Os artefatos da feature anterior (`specs/004-dispositivos/` e o ADR 0003) permanecem no
  repositório como registro histórico, marcados como superados.
- O app continua sendo de usuário único, acessado por IP via HTTPS, sem banco de dados.
- A senha do usuário único continua armazenada como hash forte, nunca em texto plano.
