# Contrato HTTP: backend ↔ frontend (autenticação)

**Feature**: `003-autenticacao` | **Date**: 2026-09-25

Todos os endpoints exigem sessão válida, **exceto** `GET /health`, `GET /auth/status`, `POST /auth/set-password` e `POST /auth/login`.

## Públicos (sem sessão)

### GET /health
`200 {"status":"ok"}`

### GET /auth/status
- `200 {"password_set": true|false, "authenticated": true|false}` — o frontend usa para decidir entre "definir senha", "login" ou o app.

### POST /auth/set-password
- Body `{"password":"..."}` — só quando `password_set == false`.
- `200 {}` + cookie de sessão (fica autenticado).

### POST /auth/login
- Body `{"password":"..."}`.
- `200 {}` + cookie de sessão.
- `401` senha errada (mensagem genérica).
- `429` bloqueio progressivo (após 5 falhas → 30 s dobrando).

## Protegidos (exigem sessão)

### POST /auth/logout
`200 {}` — revoga a sessão (limpa o cookie).

### POST /auth/change-password
- Body `{"current_password":"...","new_password":"..."}`.
- `200 {}` · `400` senha atual errada · `401` sem sessão.

### GET /boards · POST /cards · GET /version
- `401` sem sessão válida; `403` sem CSRF token em mutação.

## Notas

- O cookie de sessão é `HttpOnly`/`SameSite=Strict` (+ `Secure` em produção).
- O token CSRF via cookie (não `HttpOnly`) + header em POST/PUT/DELETE.
