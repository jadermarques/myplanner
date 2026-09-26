# Bug Assessment: Formulário "Definir senha" não submete

- **Slug**: set-password-no-submit
- **Created**: 2026-09-25
- **Source**: pasted text ("clico no salvar e nao salva")
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

Ao testar no celular, no primeiro acesso (tela "Definir senha"), clicar em "Salvar" não faz nada — a senha não é definida e o app não avança.

## Symptom

Esperado: clicar em "Salvar" define a senha e entra no app. Observado: nada acontece e nenhuma requisição é enviada.

## Reproduction

1. Abrir o app sem senha definida (tela "Definir senha").
2. Preencher "Nova senha" e "Confirmar senha".
3. Clicar em "Salvar".
4. Nenhum `POST /auth/set-password` é enviado; a tela permanece em "Definir senha".

## Suspected Code Paths

- `frontend/src/components/SetPasswordScreen.tsx:21` — `await setPassword(password)`.
- `frontend/src/services/api.ts` — `setPassword` (função da API).

## Root Cause Hypothesis

Confidence: high. No `SetPasswordScreen.tsx`, o setter do `useState` chama-se `setPassword` e o import da API também é `setPassword`; o setter local **sombreia** a função da API, então `setPassword(password)` chamava o setter do React (sem efeito) em vez de enviar o `POST`.

## Proposed Remediation

**Preferred**: renomear o import da API (`import { setPassword as submitPassword }`) e chamar `submitPassword(password)`. Depois, `onSuccess()` roda mas o status continua `password_set: false`, mantendo a tela — coerente com o sintoma.

**Files likely to change**:
- `frontend/src/components/SetPasswordScreen.tsx`
- `frontend/tests/e2e/auth.spec.ts`

**Tests to add or update**:
- E2E de regressão: submeter o form de "Definir senha" deve enviar o POST e transicionar para o app.

## Risks & Considerations

- Mudança apenas no frontend; sem risco de API.

## Open Questions

- Nenhuma.
