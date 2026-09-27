# Contrato HTTP: autenticação somente por senha

**Feature**: `005-senha-unica` | **Date**: 2026-09-26

## Públicos (sem sessão)

### GET /auth/status

- `200 {"password_set": bool, "authenticated": bool}` — o campo `device_registered` deixa de existir.

### POST /auth/set-password

- Body `{"password": "..."}` → `200 {}` + cookie de sessão.
- `400` senha fraca, ou senha já definida.
- Uma única tentativa define a senha e já autentica — não há segundo passo nem código.

### POST /auth/login

- Body `{"password": "..."}` → `200 {}` + cookie de sessão.
- `401` senha incorreta; `400` senha não definida.
- **`429` deixa de existir** — o bloqueio por tentativas foi removido por decisão do dono.

### POST /auth/logout

- `200 {}` — remove o cookie de sessão.

## Protegidos (exigem sessão)

### POST /auth/change-password

- Body `{"current_password": "...", "new_password": "..."}` → `200 {}` | `400` | `401`.

### GET /version, GET /boards, POST /cards, GET /health

- Inalterados.

## Removidos nesta feature

- `GET /devices`
- `POST /devices/{id}/revoke`
- Campo `totp` nos corpos de `/auth/login` e `/auth/set-password`
- Cookie de dispositivo (e qualquer identificação de aparelho)

## Notas

- Não existe mais nenhum segredo obrigatório para entrar além da senha (FR-006).
- Sessões válidas antes da mudança continuam válidas — o formato do cookie permanece
  compatível (FR-007).
- Registros legados de dispositivo são ignorados: não concedem nem negam acesso (FR-010).
