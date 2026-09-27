# ADR 0004 — Autenticação somente por senha (aparelhos e TOTP removidos)

**Status**: Aprovado | **Date**: 2026-09-26 | **Supersede**: ADR 0003 | **Revoga**: S4 e S5

## Contexto

A feature 004 passou a exigir TOTP ao registrar um aparelho novo e a manter uma lista de
aparelhos com revogação individual (regras S3/S4 e ADR 0003). Na prática, o custo de
operação não se justificou para um app pessoal de usuário único acessado por IP:

- `APP_TOTP_SECRET` virou **pré-requisito de instalação**: sem ele nem o primeiro acesso
  funciona, e cada aparelho exige sincronizar o app autenticador à mão (sem QR nesta versão);
- para lançar um card — o objetivo do produto, ≤10 s (P1) — o usuário pagava um passo extra
  de segundo fator a cada dispositivo novo;
- a lista de aparelhos e a revogação individual não tiveram uso real no dia a dia;
- a checagem de aparelho introduzia I/O de arquivo em **toda** requisição autenticada.

## Opções

1. **Manter TOTP + aparelhos** (status quo, S4/ADR 0003): mais forte, com o atrito descrito
   acima em todo dispositivo novo.
2. **TOTP só no primeiro acesso do app** (bootstrap): mantém o segundo fator onde ele mais
   protege, sem exigir TOTP por aparelho — reduz, mas não elimina, o atrito.
3. **Senha única, sem segundo fator e sem bloqueio por tentativas** (esta decisão): remove o
   TOTP, o conceito de aparelho, a lista, a revogação e o bloqueio progressivo. A sessão volta
   a ser stateless, como na feature 003.

## Decisão

Adotar a **opção 3**: autenticação **somente por senha**.

- `POST /auth/set-password` e `POST /auth/login` exigem apenas a senha.
- Nenhum cookie/estado de aparelho, nenhuma rota `/devices`, nenhum `APP_TOTP_SECRET`;
  `pyotp` sai das dependências.
- A sessão volta ao cookie assinado stateless de 90 dias da feature 003 (S3 mantida:
  `HttpOnly`, `Secure`, `SameSite=Strict`, renovada a cada uso).
- Permanecem como proteções: senha forte com hash Argon2id (S2), CSRF + cabeçalhos de
  segurança (S6), HTTPS obrigatório (S7), sem segredos em logs (S8), segredos somente em
  `.env` (S9) e a flag `Secure` do cookie de sessão (S3).
- **Não há bloqueio por tentativas** (S5 revogada): cada tentativa de senha é avaliada de
  forma independente.

## Consequências

- **Perda de segurança aceita e explícita**: quem obtiver a senha entra de qualquer lugar.
  Não há segundo fator, nem como cortar o acesso de um aparelho específico, nem bloqueio que
  desacelere tentativas repetidas; a defesa restante é a **força da senha** e o **HTTPS**.
- Menos código e menos estado: 4 módulos de backend (totp, device, device_store, devices),
  1 router, 1 componente de frontend e 2 campos de formulário removidos; a autenticação
  volta a não fazer I/O de arquivo por requisição.
- S4 deixa de existir: `docs/RULES.md`, `docs/SECURITY.md` e `AGENTS.md` (A8) precisam ser
  atualizados no mesmo commit — caso contrário a documentação passa a mentir.
- Os artefatos da `specs/004-dispositivos/` permanecem como registro histórico, marcados
  como superados.
- `APP_TOTP_SECRET` no `.env` fica órfão (pode ser apagado pelo dono); `COOKIE_SECURE`
  continua valendo para o cookie de sessão.
- Reversão futura: reverter este ADR + o commit da remoção, ou reintroduzir TOTP como opção.
