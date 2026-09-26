# Contrato HTTP: backend ↔ frontend

**Feature**: `001-app-shell` | **Date**: 2026-09-25

Base URL: `http://<dev-machine>:8000` (rede local, ambiente de desenvolvimento). Ambos os endpoints são públicos nesta feature (exceção temporária à S1; ver spec Clarifications).

## GET /health

Verificação de saúde pública (liveness).

- **200 OK**:
  ```json
  { "status": "ok" }
  ```
- **Erros**: 503 quando o serviço está indisponível (sem corpo específico de contrato).

## GET /version

Versão atual do app (fonte única: arquivo `VERSION`).

- **200 OK**:
  ```json
  { "version": "0.1.0" }
  ```
- **200 OK (fallback)** quando `VERSION` ausente/ilegível:
  ```json
  { "version": "unknown" }
  ```

## Notas

- O frontend trata falha de rede ao chamar `/health` ou `/version` como "sem conexão" (aviso de offline), não como erro fatal.
- Nenhum dos dois endpoints exige autenticação nesta feature; a S1 passa a valer quando login entrar no escopo.
