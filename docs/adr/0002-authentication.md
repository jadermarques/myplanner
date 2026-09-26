# ADR 0002 — Autenticação stateless sem banco de dados

**Status**: Aprovado | **Date**: 2026-09-25 | **Feature**: `003-autenticacao`

## Contexto

Autenticação de usuário único exige senha (Argon2id) e sessão de 90 dias. O projeto ainda não tem banco de dados (fora de escopo), então a solução precisa ser stateless ou com estado mínimo.

## Opções

1. **Sessão stateless** (cookie assinado com `itsdangerous`) + hash em arquivo gitignorado.
2. **Sessão server-side** (token de sessão + estado no servidor) — precisa de armazenamento/DB.
3. **JWT** — assinado, mas mais complexo que o necessário para usuário único.

## Decisão

**Sessão stateless** (cookie assinado com `SESSION_SECRET`) + hash Argon2id em `backend/.data/password_hash` (gitignorado). Renovação "sliding" de 90 dias a cada uso.

## Consequências

- Sem banco de dados: proporcional (princípio V).
- `SESSION_SECRET` é o único novo segredo (`.env`).
- Migração para DB (futuro) trocaria apenas `password_store.py`, sem afetar domínio/aplicação.
