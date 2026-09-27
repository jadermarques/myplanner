# Research: Reformulação da interface

**Feature**: `007-reformulacao-ui` | **Date**: 2026-09-26

Decisões de UX tomadas pelo agente (instrução explícita do dono: decidir sozinho). Cada uma
aponta o problema observado na interface atual e o princípio aplicado.

## D1 — Estrutura: cabeçalho fixo + conteúdo rolável + ação fixa

- **Problema atual**: `.home { justify-content: center; height: 100% }` centraliza tudo; com o
  teclado aberto (que come metade da tela) o conteúdo é empurrado e a ação sai de vista.
- **Decisão**: três faixas — **cabeçalho** (identidade + board + menu), **conteúdo** (o
  formulário) e **barra de ação** no rodapé, fixa, sempre na zona do polegar.
- **Princípio**: a ação principal não pode depender de rolagem nem da altura da tela.

## D2 — Alturas dinâmicas e áreas seguras

- **Decisão**: usar `100dvh` (e não `100vh`) e aplicar `env(safe-area-inset-*)` no cabeçalho e na
  barra de ação; o `<meta viewport>` já tem `viewport-fit=cover`.
- **Por quê**: no iOS o `100vh` ignora a barra do navegador (o rodapé "escapa" da tela) e sem
  `safe-area` os controles encostam no notch/home indicator (FR-008).

## D3 — Título já focado

- **Problema atual**: o usuário toca no campo antes de digitar (1 toque por card).
- **Decisão**: focar o campo de título ao montar a tela **e após cada sucesso**; nunca roubar
  foco enquanto o usuário digita.
- **Limite conhecido e honesto**: navegadores móveis podem exigir um gesto para **abrir o
  teclado**; o app garante o **cursor pronto** (0 toques para posicionar) — depois do primeiro
  salvamento o gesto já ocorreu e o teclado abre sozinho nos próximos cards.

## D4 — Prioridade em escolha direta (chips)

- **Problema atual**: `<select>` custa 2 toques (abrir + escolher) e esconde as opções.
- **Decisão**: grupo de botões (um `radiogroup` nomeado "Prioridade" com 6 opções: *Sem
  prioridade* + as 5 do domínio), todos visíveis, **1 toque**.
- **Acessibilidade**: semântica de rádio (setas do teclado funcionam) e alvos ≥48 px.
- **Contrato de teste**: a intenção do teste atual ("só as prioridades configuradas são
  oferecidas") é **preservada**, com as asserções traduzidas para o novo papel.

## D5 — Board como chip no cabeçalho

- **Problema atual**: um segundo `<select>` grande disputa espaço com a digitação.
- **Decisão**: manter um **`<select>` real** (picker nativo = rápido e acessível) **estilizado
  como chip**, exibindo o board atual; continua lembrando o último usado via `localStorage`.
- **Por quê não um menu customizado**: seria mais código e pior acessibilidade para ganhar nada.

## D6 — Ações secundárias fora do fluxo

- **Problema atual**: "Trocar senha" e "Sair" ficam logo abaixo do botão Salvar, competindo
  visualmente com a captura; a versão fica num rodapé **fixo sobreposto**.
- **Decisão**: um botão de menu ("⋯") no cabeçalho abre um painel com **Trocar senha** e **Sair**;
  a **versão** permanece em um `<footer>` discreto no fim do conteúdo (sem sobrepor nada) —
  decisão que também preserva o teste de versão existente.

## D7 — Tema escuro único com tokens

- **Decisão**: um conjunto de variáveis CSS (`--bg`, `--surface`, `--surface-2`, `--border`,
  `--text`, `--muted`, `--accent`, `--danger`, `--ok`, raios, sombras, espaçamento) e tipografia
  com tamanho base 16 px nos campos.
- **Por quê 16 px**: abaixo disso o **iOS dá zoom automático** ao focar um campo, o que desloca
  o layout no pior momento (durante a digitação).

## D8 — Feedback e "próximo card"

- **Decisão**: no sucesso, uma faixa com ícone (via CSS `::before`, para **não** alterar o texto do
  elemento `role="status"`) mantendo o texto exato **"Card criado!"**, campos limpos, descrição
  recolhida e foco de volta no título.
- **Em erro**: mensagem legível, texto preservado (SC-004 da 006 mantida) e alvo de reenvio.

## D9 — Acessibilidade e movimento

- **Decisão**: `:focus-visible` com anel de 2 px de alto contraste; contraste ≥4.5:1 em todo texto;
  transições curtas (≈120 ms) desativadas sob `prefers-reduced-motion: reduce`.

## D10 — Migração dos testes sem enfraquecer nada

- **Decisão**: manter **todos** os nomes acessíveis e papéis usados hoje (FR-010). Os dois únicos
  ajustes necessários — o teste da prioridade (novo controle) e o E2E de home (mesmos elementos) —
  preservam a intenção original e ganham asserções **novas** de ergonomia (alvos ≥48 px,
  0 toques preparatórios, 320×568), sem remover nenhuma verificação existente.
