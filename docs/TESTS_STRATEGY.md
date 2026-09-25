# Estratégia de testes — myplanner

## Princípio

TDD como auditor da spec: ciclo Red → Green → Refactor. Os testes nascem das tasks,
antes do código.

## Pirâmide

- Unitários (domínio e aplicação).
- Integração (API com o Trello simulado).
- Contrato (contra respostas reais gravadas da API do Trello).
- E2E (Playwright em viewport de celular).
- Regressão (um teste por bug corrigido).

## Cobertura

- Mínimo de 80% em `domain` e `application`.
- Toda regra de `docs/RULES.md` precisa de ao menos um teste que a referencie pelo
  código (ex.: `R3`).

## Regra de ouro

- Proibido alterar, apagar ou "consertar" um teste que falha para fazê-lo passar.
- Mudar um teste exige aprovação humana e atualização da spec.

## O que não testar

- Comportamento interno do cliente HTTP do Trello (contrato cobre as respostas).
- Frameworks/bibliotecas de terceiros.
- Detalhes de implementação que não afetam regras de domínio.
