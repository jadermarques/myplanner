# Quickstart: autenticação somente por senha

**Feature**: `005-senha-unica`

## Pré-requisitos

- Features 001–004 implementadas.
- `.env` com `TRELLO_API_KEY`, `TRELLO_TOKEN` e `SESSION_SECRET`.
  `APP_TOTP_SECRET` **deixa de ser necessário** e pode ser removido do `.env`.

## Backend

```bash
cd backend
source .venv/bin/activate
pip-sync requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Frontend

```bash
cd frontend
npm ci
npm run dev -- --host
```

## Validação ponta a ponta

1. `GET /health` → `200 {"status":"ok"}`; qualquer outro endpoint sem sessão → `401`.
2. `GET /auth/status` → `{"password_set": true, "authenticated": false}` — **sem** o campo
   `device_registered`.
3. Entrar informando **apenas a senha** → `200` + cookie de sessão, sem nenhum pedido de código.
4. `GET /devices` → **`404`** (a rota não existe mais).
5. Na interface: nenhum campo de código, nenhum botão "Aparelhos", nenhuma menção a revogação.
6. Errar a senha repetidas vezes → sempre `401`, **sem** bloqueio (`429` não existe mais).
7. Sessão aberta antes da mudança: continua válida (não desloga).
