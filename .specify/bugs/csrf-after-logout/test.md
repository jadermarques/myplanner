# Bug Verification: "CSRF inválido" ao salvar

- **Slug**: csrf-after-logout
- **Tested**: 2026-09-26
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

O sintoma não reproduz: o logout encerra a sessão de verdade e o cookie de CSRF não fica mais
faltando em silêncio (a renovação o reemite). Nenhuma regressão nas suítes existentes.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reprodução (antes do fix) | testes de regressão novos | **fail (RED)** | provou a causa raiz antes de corrigir |
| Reprodução (pós-fix) | `curl` com cliente real contra instância isolada `:8001` | **pass** | logout remove o cookie de sessão; `GET /version` → 401 |
| Auto-cura do CSRF | `curl` com sessão e sem cookie `csrf_token` | **pass** | `GET /version` → 200 e o cookie foi reemitido |
| Testes novos / atualizados | `uv run pytest -q` | **pass** | 49 passed |
| Suíte de regressão (backend) | `uv run pytest -q` | **pass** | 49 passed |
| Suíte frontend | `npm test` | **pass** | 12 passed (5 files) |
| E2E (Playwright mobile) | `npx playwright test` | **pass** | 11 passed |
| Build / type-check | `npm run build` | **pass** | tsc + PWA build OK |
| Detector de segredos | pre-commit (gitleaks) | **pass** | no commit |

## Output Excerpts

```
1) POST com csrf (esperado 404 = passou no CSRF) -> 404
2) POST sem csrf (esperado 403) -> 403
3) logout -> 200
4) cookie session ainda no jar? (esperado 0) -> 0
5) GET /version apos logout (esperado 401) -> 401
6) GET /version com sessao mas SEM cookie csrf (esperado 200) -> 200
7) cookie csrf reemitido? (esperado 1) -> 1
```

```
tests/test_routes_auth.py::test_logout_really_ends_the_session PASSED
tests/test_routes_auth.py::test_csrf_cookie_is_reissued_on_authenticated_requests PASSED
49 passed, 1 warning in 1.50s
```

## Residual Risks

- O navegador que já estava no estado quebrado (sessão válida, sem cookie de CSRF) se recupera
  sozinho na primeira requisição autenticada — não é preciso sair e entrar de novo.
- A renovação passa a emitir 2 `Set-Cookie` por resposta autenticada em vez de 1 (desprezível).
- Não foi exercitada a criação de card real contra a API do Trello (exigiria chamada externa
  autorizada); a barreira que falhava (o `403`) foi validada no cliente HTTP real.

## Recommendation

Fechar o bug — verificado ponta a ponta: reprodução registrada em RED, fix aplicado, testes de
regressão permanentes e suítes completas verdes.
