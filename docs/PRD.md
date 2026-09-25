# PRD — myplanner

## Visão

App web mobile-first (PWA), de uso pessoal e de usuário único, para lançar cards no
Trello em segundos pelo celular. Integra-se aos boards do usuário exclusivamente pela
API REST oficial do Trello.

## Problema

O app oficial do Trello exige passar por vários campos (cerca de 20 s por card). Este
app reúne tudo em uma única tela.

## Persona

Usuário único (o dono do app), que usa o celular para registrar rapidamente cards no
Trello a partir de qualquer lugar.

## Critério de sucesso principal

Abrir o app e salvar um card simples em até 10 segundos, sem contar o tempo de digitação.

## Não objetivos (fora de escopo desta versão)

- Editar, mover, arquivar ou listar cards existentes.
- Campo descrição do card (virá depois).
- Banco de dados próprio (virá depois).
- Funcionalidades com IA em tempo de execução (virão depois; apenas deixar a interface preparada).
- Múltiplos usuários.
- Funcionamento offline (sem internet, o app só informa que precisa de conexão).
- App nativo nas lojas.

## Objetivos mensuráveis

- Salvar um card simples em até 10 s (sem contar a digitação).
- Tela única com todos os campos necessários.

## Referências

- `docs/ARCHITECTURE.md` — topologia e decisões.
- `docs/RULES.md` — invariantes (R/S/P/O).
- `docs/SECURITY.md` — modelo de ameaças e autenticação.
- `docs/TESTS_STRATEGY.md` — pirâmide e cobertura.
