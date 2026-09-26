# Bug Fix: Formulário "Definir senha" não submete

- **Slug**: set-password-no-submit
- **Fixed**: 2026-09-25
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Renomeado o import da API para evitar a colisão de nomes com o setter do `useState`, fazendo o formulário enviar de fato o `POST /auth/set-password`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/SetPasswordScreen.tsx` | modified | `import { setPassword as submitPassword }` + `await submitPassword(password)` |
| `frontend/tests/e2e/auth.spec.ts` | added test | regressão E2E do submit de "definir senha" |

## Diff Highlights

```diff
-import { setPassword } from '../services/api'
+import { setPassword as submitPassword } from '../services/api'
...
-      await setPassword(password)
+      await submitPassword(password)
```

## Tests Added or Updated

- `frontend/tests/e2e/auth.spec.ts::first access: submitting the set-password form creates a session` — garante o POST e a transição para a tela "Inserir card".

## Local Verification

- Commands run: `npx playwright test` → **9 passed**; `uv run pytest` → **41 passed**; `npm test` → **11 passed**
- Manual checks: requisição `POST /api/auth/set-password` observada após o clique.

## Deviations from Assessment

Nenhuma.

## Follow-ups

- Nenhum.
