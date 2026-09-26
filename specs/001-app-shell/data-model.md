# Data Model: Base mínima do app (shell PWA)

**Feature**: `001-app-shell` | **Date**: 2026-09-25

Nenhuma persistência (sem banco de dados nesta feature). O modelo é apenas conceitual/in-memory.

## Entidades

### Versão do app
- **Descrição**: identificador da versão em execução.
- **Atributos**:
  - `value`: string, formato SemVer `0.x.y` (ex.: `0.1.0`). Fonte única: arquivo `VERSION` na raiz do repositório.
  - `source`: caminho do arquivo `VERSION` (resolvido pela configuração).
- **Regras/validação**:
  - A versão exibida e exposta DEVE ser idêntica ao conteúdo do arquivo `VERSION` (FR-004, FR-006, SC-004).
  - Se o arquivo estiver ausente/ilegível, retornar `"unknown"` (falha controlada, sem travar — edge case).
- **Relacionamentos**: nenhum.

### Estado de saúde (liveness)
- **Descrição**: sinal de que o backend está operacional.
- **Atributos**: `status`: `"ok"`.
- **Regras/validação**: `GET /health` retorna `200` com `{"status": "ok"}` quando o processo está de pé (FR-005).

### Estado de conectividade (frontend)
- **Descrição**: indica se o app consegue se comunicar com o backend.
- **Atributos**: `online`: booleano (derivado de `navigator.onLine` + sucesso do ping ao `/health`).
- **Regras/validação**: quando `online == false`, a tela exibe o aviso de que precisa de conexão (FR-007).

## Transições de estado

- `online` (true → false): exibe `OfflineNotice`.
- `online` (false → true): oculta `OfflineNotice` e volta à tela inicial (US2).
