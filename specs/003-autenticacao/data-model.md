# Data Model: Autenticação do usuário único

**Feature**: `003-autenticacao` | **Date**: 2026-09-25

Sem banco de dados. Estado mínimo em arquivo gitignorado + cookie assinado.

## Entidades

### Usuário (único)
- **Descrição**: o único usuário do app.
- **Atributos**: `password_hash` (Argon2id), persistido em `backend/.data/password_hash`.
- **Regras**: definido no primeiro acesso (FR-009); trocável (FR-010); nunca em logs (S8).

### Sessão
- **Descrição**: cookie assinado (`itsdangerous`, HMAC com `SESSION_SECRET`).
- **Atributos**: `expires_at` (agora + 90 dias), `authenticated`.
- **Regras**: renovado a cada uso (sliding 90 dias) (FR-002); `HttpOnly`/`SameSite=Strict` (+ `Secure` em produção).

### Estado de bloqueio
- **Descrição**: contagem de tentativas de login falhas.
- **Atributos**: `failed_attempts`, `locked_until`.
- **Regras**: 5 falhas → 30 s, dobrando a cada nova falha; reset ao acertar (FR-004).

## Transições de estado

- `sem senha` → (definir senha) → `senha definida` → (login) → `autenticado` → (logout) → `não autenticado`.
- `autenticado` → (trocar senha) → `autenticado` (nova senha).
