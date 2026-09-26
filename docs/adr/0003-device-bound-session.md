# ADR 0003 — Sessão vinculada ao aparelho (TOTP e revogação)

**Status**: Aprovado | **Date**: 2026-09-25 | **Feature**: `004-dispositivos`

## Contexto

A regra S4 exige TOTP ao registrar um novo aparelho, e a spec exige poder revogar aparelhos individualmente. A sessão da feature 003 (cookie assinado stateless com `authenticated`) não permitiria invalidar a sessão de um aparelho específico.

## Opções

1. **Sessão com `device_id`** (cookie assinado) + checagem de que o aparelho continua registrado.
2. **Sessões server-side** (tabela de sessões) — precisa de estado/DB maior.
3. **Blacklist de sessões revogadas** — estado adicional e complexo.

## Decisão

**Sessão assinada incluindo `device_id`**, com aparelhos em `backend/.data/devices.json` (gitignorado). A checagem de auth valida a assinatura + o prazo + que o `device_id` ainda existe.

## Consequências

- Revogar um aparelho invalida sua sessão (FR-006) sem banco de dados.
- Cada requisição autenticada lê o arquivo de aparelhos (pequeno; aceitável para usuário único).
- Migrar para DB no futuro troca apenas `device_store.py`.
