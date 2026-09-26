# Quickstart: Inserir card no Trello

**Feature**: `002-inserir-card` | **Date**: 2026-09-25

Guia de validação ponta a ponta. Requer as credenciais no `.env` (`TRELLO_API_KEY` + `TRELLO_TOKEN`).

## Pré-requisitos

- Python 3.12, Node 22.
- `.env` preenchido com `TRELLO_API_KEY` e `TRELLO_TOKEN`.
- Celular e máquina na mesma rede local.

## Backend

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Frontend

```bash
cd frontend
npm run dev -- --host
```

Abra no celular: `http://<ip>:5173`.

## Validação ponta a ponta

1. **Listar boards (US2)**: abrir o app → o seletor lista os boards da conta.
2. **Criar card (US1)**: digitar título, escolher board e prioridade → tocar "Salvar" → confirmação; o card aparece no Trello (na primeira lista do board). **SC-001**: medir "salvar ≤ 10 s" (cronômetro, do toque em Salvar até a confirmação).
3. **Prioridade (US3)**: escolher uma prioridade → o label correspondente aparece no card.
4. **Erro (FR-008)**: com título vazio, "Salvar" mostra erro no campo; com token inválido, mensagem acionável.

## Testes

```bash
cd backend && uv run pytest          # unit + integração (Trello simulado)
cd frontend && npm test              # unit
cd frontend && npx playwright test   # E2E
```
