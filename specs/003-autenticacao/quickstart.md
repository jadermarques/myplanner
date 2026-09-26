# Quickstart: Autenticação do usuário único

**Feature**: `003-autenticacao` | **Date**: 2026-09-25

## Pré-requisitos

- Python 3.12, Node 22.
- `.env` com `SESSION_SECRET` (gerar: `python -c "import secrets; print(secrets.token_hex(32))"`).

## Backend

```bash
cd backend
uv pip install -r requirements.txt   # após recompilar com argon2-cffi, itsdangerous
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Frontend

```bash
cd frontend
npm run dev -- --host
```

## Validação ponta a ponta

1. **Definir senha (US1)**: abrir `http://<ip>:5173` → sem senha, aparece "definir senha" → definir → autenticado.
2. **Login (US2)**: sair e logar com a senha. **SC-001**: medir login ≤ 3 s.
3. **Trocar senha (US3)**: trocar a senha e confirmar que a nova vale.
4. **Proteção (US6)**: `curl http://localhost:8000/boards` sem cookie → `401`; `curl /health` → `200`.
5. **Bloqueio (US5)**: errar a senha 5× → `429` com espera progressiva.

## Testes

```bash
cd backend && uv run pytest
cd frontend && npm test
cd frontend && npx playwright test
```
