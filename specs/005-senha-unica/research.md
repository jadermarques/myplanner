# Research: Autenticação somente por senha

**Feature**: `005-senha-unica` | **Date**: 2026-09-26

Escopo **subtrativo**: as decisões abaixo tratam de *como remover* sem efeitos colaterais.
Não há `[NEEDS CLARIFICATION]` pendente (resolvidos no `/speckit.clarify`).

## D1 — Não deslogar ninguém ao remover o vínculo por aparelho

- **Decisão**: manter o formato do cookie de sessão compatível; a checagem passa a considerar
  apenas a validade da assinatura, o prazo e o indicador de autenticação.
- **Alternativa rejeitada**: trocar o formato/salt da sessão — invalidaria todas as sessões
  ativas (violaria FR-007) e deslogaria o dono sem necessidade.
- **Consequência**: quem já está logado continua logado até o prazo normal (90 dias).

## D2 — Arquivo de estado dos aparelhos

- **Decisão**: deixar de usá-lo e remover o módulo que o manipula; o arquivo em
  `backend/.data/` (gitignorado) fica inerte e pode ser apagado pelo dono, sem impacto (FR-010).
- **Alternativa rejeitada**: manter o arquivo — estado morto, sem leitor, um vestígio a mais.

## D3 — Registro legado de dispositivo no navegador

- **Decisão**: o registro legado é **ignorado** — não concede, não nega e não condiciona
  acesso (FR-010). Nenhum código novo é necessário para tratá-lo.
- **Alternativa rejeitada**: limpar ativamente o registro antigo — código extra para apagar
  algo já inerte.

## D4 — Remoção do `pyotp`

- **Decisão**: remover de `requirements.in` e recompilar `requirements.txt` com hashes
  (pip-tools), mantendo O1.
- **Alternativa rejeitada**: deixar a dependência instalada e sem uso — viola V
  (proporcionalidade) e mantém superfície morta.

## D5 — Bloqueio progressivo

- **Decisão**: remover o rastreador de tentativas e seus testes; o login avalia cada tentativa
  de forma independente (FR-004, clarificação de 2026-09-26). A regra S5 sai do `docs/RULES.md`.
- **Risco assumido**: sem bloqueio, as tentativas de senha são ilimitadas; a defesa restante é
  a força da senha (hash Argon2id) e o HTTPS. Registrado no ADR 0004.

## D6 — Contrato de `/auth/status`

- **Decisão**: manter `password_set` e `authenticated`; remover `device_registered` — o app
  deixa de precisar saber de aparelhos.
- **Alternativa rejeitada**: manter o campo sempre `true` — resquício na interface (FR-009).

## D7 — Flag `Secure` do cookie de sessão

- **Decisão**: manter `COOKIE_SECURE` (config), `true` em produção (S3/S7) e `false` em
  desenvolvimento por HTTP.
- **Alternativa rejeitada**: remover a flag — o cookie perderia a proteção `Secure` em produção.
