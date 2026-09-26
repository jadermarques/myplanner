# ADR 0001 — Cliente Trello (primeira integração externa)

**Status**: Aprovado | **Date**: 2026-09-25 | **Feature**: `002-inserir-card`

## Contexto

Primeira integração externa do projeto: o backend precisa chamar a API REST do Trello para criar cards e listar boards. O token do Trello deve existir somente no servidor (R2), e o frontend nunca chama o Trello diretamente (R1).

## Opções

1. **httpx assíncrono** (cliente manual) — já no stack (A6), testável via `MockTransport`.
2. **requests** (síncrono) — simples, mas bloqueia o loop do FastAPI.
3. **SDK de terceiros** — abstração pronta, porém dependência extra e menos controle sobre rate limit/backoff.

## Decisão

**httpx assíncrono**, com cliente próprio em `infrastructure/trello_client.py`, credenciais via `.env`, e `httpx.MockTransport` para os testes de integração (nunca chama o Trello real nos testes).

## Consequências

- Backoff exponencial em 429 implementado no cliente (P2).
- Testes de integração determinísticos (sem rede/credenciais reais).
- Trocar de cliente/versão do Trello não afeta as camadas de domínio/aplicação.
