# Research: Descrição do card

**Feature**: `006-descricao-do-card` | **Date**: 2026-09-26

Clarificações já resolvidas (ver `## Clarifications` na spec): limite de **2.000 caracteres**
com contador e salvamento bloqueado; campo **recolhido** por padrão.

## D1 — Como enviar a descrição ao Trello

- **Decisão**: enviar o parâmetro `desc` na criação do card (`POST /cards`), **somente quando
  houver texto** (após normalizar). Sem texto → o parâmetro não é enviado.
- **Alternativa rejeitada**: enviar `desc=""` sempre — ruído desnecessário e risco de
  criar um campo vazio onde hoje não existe.
- **Consequência**: o card sem descrição é idêntico ao de hoje (nenhuma mudança de payload).

## D2 — Onde fica a regra do limite de 2.000 caracteres

- **Decisão**: o limite é uma **constante do domínio** (`MAX_DESCRIPTION_CHARS`) usada na
  validação do `Card`; a API rejeita acima disso com mensagem clara; o frontend mantém a
  mesma constante para o contador e para bloquear o envio.
- **Alternativa rejeitada**: expor o limite por um endpoint de configuração — uma rota nova
  para um número fixo não se paga (princípio V).
- **Consequência**: dois pontos com o mesmo número (frontend/backend). O backend é a
  autoridade — o teste de contrato garante que ele recusa acima do limite mesmo que a UI falhe.

## D3 — Normalização do texto

- **Decisão**: `strip()` antes de decidir se há descrição; **o miolo é preservado exatamente**
  (acentos, emojis, quebras de linha e espaços internos).
- **Alternativa rejeitada**: colapsar espaços ou reescrever quebras — alteraria o texto do
  usuário (violaria FR-002 e SC-001).
- **Consequência**: só espaços/quebras → tratada como vazia (FR-003).

## D4 — Campo recolhido (não atrapalhar o card simples)

- **Decisão**: um gatilho textual ("adicionar descrição") revela o campo; enquanto fechado,
  **nenhum** elemento ocupa espaço no fluxo. Após salvar com sucesso, o campo volta a ficar
  fechado e vazio.
- **Alternativa rejeitada**: campo sempre visível — adiciona altura e rolagem no caminho de
  quem só quer título + prioridade (colidiria com P1/FR-009).
- **Consequência**: o E2E do card simples continua idêntico; um E2E novo cobre abrir → digitar.

## D5 — Contador e bloqueio

- **Decisão**: contador visível no formato usado/limite (`1234/2000`) que muda de cor ao
  ultrapassar; com o texto acima do limite, o botão **Salvar** fica desabilitado e uma
  mensagem explica o motivo. O texto digitado **não** é cortado automaticamente.
- **Alternativa rejeitada**: truncar ao digitar (`maxLength`) — esconderia a perda do texto e
  confundiria (o usuário veria caracteres sumindo).
- **Consequência**: o usuário decide o que remover; nada se perde (SC-004).

## D6 — Preservação do texto em falha

- **Decisão**: o estado dos campos só é limpo após o sucesso; em erro, título e descrição
  permanecem no formulário (comportamento atual do título, estendido à descrição).
- **Alternativa rejeitada**: limpar otimisticamente — perda de texto em falha (SC-004).
- **Consequência**: nenhuma mudança estrutural; só garantir que a limpeza continue no `try`.

## D7 — Regra R4

- **Decisão**: revogar R4 em `docs/RULES.md` (mantendo R1–R3 e R5) e atualizar o docstring do
  domínio que a citava; registrar a superação na spec 002 (FR-006), que a impunha.
- **Alternativa rejeitada**: manter R4 e implementar a descrição "fora da regra" — deixaria a
  documentação mentindo (drift proibido por A5).
- **Consequência**: um item de documentação além do código.
