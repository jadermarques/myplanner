# Contrato HTTP: aparelhos e TOTP

**Feature**: `004-dispositivos` | **Date**: 2026-09-25

## Públicos (sem sessão)

### GET /auth/status
- `200 {"password_set": bool, "authenticated": bool, "device_registered": bool}` — `device_registered: false` indica que o login vai exigir TOTP.

### POST /auth/login
- Body `{"password": "...", "totp": "123456"}` (`totp` só quando o aparelho é novo).
- `200 {}` + cookie de sessão (aparelho conhecido).
- `200 {}` + cookie de sessão e registro do aparelho (aparelho novo com `totp` válido).
- `401` senha incorreta, `totp` ausente/inválido, ou aparelho novo sem `totp`.
- `429` bloqueio progressivo (apenas por senha).

## Protegidos (exigem sessão)

### GET /devices
- `200 [{"id","name","created_at","last_used_at"}]`.

### POST /devices/{id}/revoke
- `200 {}` — o aparelho deixa de ser válido (sessões dele passam a `401`).
- `404` se o aparelho não existir.

## Notas

- O cookie `device_id` é `HttpOnly`; só o servidor o define/valida.
- Revogar o próprio aparelho atual invalida a sessão atual (o app volta ao login com TOTP).
