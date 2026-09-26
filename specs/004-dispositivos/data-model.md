# Data Model: Aparelhos e TOTP

**Feature**: `004-dispositivos` | **Date**: 2026-09-25

Sem banco de dados. Aparelhos em `backend/.data/devices.json` (gitignorado).

## Entidades

### Aparelho (Device)
- **Descrição**: um dispositivo registrado que pode acessar o app.
- **Atributos**:
  - `id`: string (token gerado pelo servidor), enviado no cookie `device_id`.
  - `name`: string derivada do User-Agent.
  - `created_at`: data/hora do registro (ISO 8601).
  - `last_used_at`: data/hora do último acesso (ISO 8601).
- **Regras**: criado apenas após senha + TOTP válidos (S4); revogado deixa de ser válido (FR-006).

### Sessão (estendida)
- **Atributos**: `authenticated`, `device_id`, `expires_at`.
- **Regras**: válida apenas se `device_id` ainda estiver registrado (revogação invalida).

## Transições de estado

- `aparelho novo` → (senha + TOTP) → `registrado` → (uso) atualiza `last_used_at`.
- `registrado` → (revogar) → `removido` → nova tentativa exige senha + TOTP.
