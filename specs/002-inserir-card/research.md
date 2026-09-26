# Research: Inserir card no Trello

**Feature**: `002-inserir-card` | **Date**: 2026-09-25

## 1. Criação de card exige uma lista (idList)

- **Decision**: o card vai para a primeira lista aberta do board selecionado (`GET /1/boards/{id}/lists?filter=open` → primeira).
- **Rationale**: o `POST /1/cards` do Trello exige `idList` (não aceita apenas board). Escolher automaticamente a primeira lista mantém a tela única e o fluxo rápido (≤10 s).
- **Alternatives considered**:
  - Usuário escolher também a lista — mais um campo, contraria a tela única/velocidade.
  - Lista padrão configurável — complexidade desnecessária para o MVP.

## 2. Prioridade → label por nome

- **Decision**: buscar labels do board (`GET /1/boards/{id}/labels`) e casar por nome; aplicar via `idLabels`.
- **Rationale**: alinha com R3 e com a decisão do clarify (assumir labels existentes). Por nome evita depender de ids estáveis.
- **Alternatives considered**:
  - Criar label automaticamente — mais chamadas, fere a meta ≤10 s; rejeitado.

## 3. Cliente Trello

- **Decision**: `httpx` assíncrono; base `https://api.trello.com/1`; key+token do `.env`; testes com `httpx.MockTransport`.
- **Rationale**: já no stack (A6, "cliente HTTP assíncrono"); `MockTransport` permite testes de integração sem chamar a API real.
- **Alternatives considered**:
  - `requests` — síncrono, fora do padrão assíncrono do FastAPI.
  - SDK de terceiros — dependência extra, desnecessária.

## 4. Rate limit / backoff

- **Decision**: orçamento abaixo de 100 req/10 s (`trello.rate_limit.requests_per_10s`); em HTTP 429, backoff exponencial com retry limitado.
- **Rationale**: cumpre P2; backoff exponencial evita agravar o 429.
- **Alternatives considered**: retry imediato (agrava o 429) — rejeitado.

## 5. Arquitetura em camadas

- **Decision**: introduzir `api → application → domain → infrastructure` no backend.
- **Rationale**: primeira integração + regras de domínio (R3/R5) tornam as camadas concretas (deixou de ser "por precaução").
- **Alternatives considered**: manter módulo único — acoplaria rotas, regras e cliente Trello; rejeitado (ver ADR 0001).
