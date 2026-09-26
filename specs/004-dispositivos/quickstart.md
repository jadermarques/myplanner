# Quickstart: Aparelhos e TOTP

**Feature**: `004-dispositivos` | **Date**: 2026-09-25

## Pré-requisitos

- Features 001–003 já implementadas.
- `.env` com `APP_TOTP_SECRET` (base32) além de `SESSION_SECRET` e do Trello.
  - Gerar base32: `python -c "import pyotp; print(pyotp.random_base32())"`.

## Backend

```bash
cd backend
uv pip install -r requirements.txt   # após recompilar com pyotp
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Frontend

```bash
cd frontend
npm run dev -- --host
```

## Validação ponta a ponta

1. **Novo aparelho (US1)**: no celular, sem cookie de aparelho, faça login → pede o código TOTP → informe o código do app autenticador → entra.
2. **Aparelho conhecido**: saia e logue de novo → só a senha (sem TOTP).
3. **Lista (US2)**: abra a lista de aparelhos → o atual aparece.
4. **Revogar (US3)**: revogue o aparelho → a sessão dele cai (`401`) e o próximo login exige TOTP de novo.

## Testes

```bash
cd backend && uv run pytest
cd frontend && npm test
cd frontend && npx playwright test
```
