# Quickstart: Base mínima do app (shell PWA)

**Feature**: `001-app-shell` | **Date**: 2026-09-25

Guia de validação ponta a ponta no ambiente de desenvolvimento local. Detalhes de implementação ficam em `tasks.md`.

## Pré-requisitos

- Python 3.12.
- Node 22 (via `nvm`, ver `.nvmrc`).
- Celular e máquina de desenvolvimento na mesma rede local.

## Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install pip-tools && pip-compile requirements.in && pip-sync requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Validação:

```bash
curl http://localhost:8000/health   # → {"status":"ok"}
curl http://localhost:8000/version  # → {"version":"0.1.0"} (igual ao arquivo VERSION)
```

## Frontend

```bash
cd frontend
nvm use
npm ci
npm run dev -- --host
```

Abra no celular: `http://<ip-da-máquina>:5173`.

## Validação ponta a ponta

1. **Tela inicial (US1)**: abrir o endereço no navegador do celular → ver o ícone central "Inserir card" e a versão no rodapé (igual a `VERSION`). **SC-001**: medir que a tela aparece em ≤ 3 s (cronômetro, do toque no endereço até o ícone + versão visíveis).
2. **Aviso offline (US2)**: ativar modo avião e recarregar → ver o aviso "precisa de conexão"; desativar modo avião → o aviso some.
3. **Instalação PWA (US3)**: "Adicionar à tela inicial" no navegador → abrir pelo ícone instalado → mesma tela inicial.

## Testes

```bash
cd backend && pytest          # unit + integração (health/version)
cd frontend && npm test       # unit (Vitest + React Testing Library)
cd frontend && npx playwright test   # E2E em viewport de celular
```
