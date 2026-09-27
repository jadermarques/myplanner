# Bug Fix: "CSRF inválido" ao salvar (o logout não encerrava a sessão)

- **Slug**: csrf-after-logout
- **Fixed**: 2026-09-26
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

O `SessionMiddleware` renovava o cookie de sessão **depois** de cada resposta autenticada — inclusive
na resposta do `POST /auth/logout` — ressuscitando o cookie que a rota acabara de apagar. Efeito:
a sessão sobrevivia ao logout **e** o cookie de CSRF (apagado pela rota e nunca renovado)
desaparecia, deixando toda gravação com `403 CSRF inválido`. Agora a rota de logout marca
`request.state.session_ended` e a renovação é pulada; além disso a renovação passou a reemitir
também o cookie de CSRF, com o valor que o cliente já possui.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/app/api/middleware.py` | modified | `_renew_cookies()` extraído: renova a sessão (mesmo payload) **e** reemite o cookie de CSRF (mesmo valor; um novo se estiver ausente); a renovação é pulada quando `request.state.session_ended` está marcado |
| `backend/app/api/routes_auth.py` | modified | `logout_route` marca `request.state.session_ended = True` antes de apagar os cookies |
| `backend/tests/test_routes_auth.py` | added tests | 2 testes de regressão permanentes |
| `backend/app/api/middleware.py` | removed | instrumentação temporária `[csrf-diag]` usada só no diagnóstico (registrava presença/tamanho, nunca valores) |

## Diff Highlights

```python
# backend/app/api/routes_auth.py
@router.post("/logout")
def logout_route(request: Request, response: Response) -> dict:
    # a renovação não pode ressuscitar os cookies que estamos apagando
    request.state.session_ended = True
    response.delete_cookie(SESSION_COOKIE)
    response.delete_cookie(CSRF_COOKIE)
    return {}

# backend/app/api/middleware.py
if request.state.authenticated and not getattr(request.state, "session_ended", False):
    _renew_cookies(request, response)   # sessão + CSRF (mesmo valor, sem rotação)
```

## Tests Added or Updated

- `backend/tests/test_routes_auth.py::test_logout_really_ends_the_session` — depois do logout o
  cookie de sessão sai do jar e `GET /version` responde `401` (falhava antes do fix).
- `backend/tests/test_routes_auth.py::test_csrf_cookie_is_reissued_on_authenticated_requests` —
  com o cookie de CSRF removido, uma requisição autenticada o reemite (auto-cura).

## Local Verification

- Commands run: `uv run pytest -q` → **49 passed** (47 antes + 2 regressões);
  `npm test` → 12 passed; `npx playwright test` → 11 passed; `npm run build` → OK.
- Manual checks: cliente HTTP real contra instância isolada (`:8001`): POST com CSRF → 404 (passou);
  sem CSRF → 403; logout → 200 com o cookie de sessão **removido**; `GET /version` após logout →
  **401**; sessão sem cookie de CSRF → `GET /version` 200 **e** o cookie reaparece.

## Deviations from Assessment

Nenhum.

## Follow-ups

- Nenhum. O comentário/instrumentação de diagnóstico foi removido no mesmo commit.
