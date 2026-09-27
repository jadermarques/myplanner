# Bug Assessment: "CSRF inválido" ao salvar (o logout não encerra a sessão)

- **Slug**: csrf-after-logout
- **Created**: 2026-09-26
- **Source**: pasted text — "quando salvo da um erro CSRF invalido"
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

Ao criar um card ("salvar"), o app exibe **"CSRF inválido"**. O log do backend confirma
`POST /cards → 403 Forbidden` repetidamente, mesmo com a sessão aparentemente ativa.

## Symptom

**Esperado**: salvar um card com a sessão ativa.
**Observado**: `POST /cards` → `403 {"detail":"CSRF inválido"}`.

## Reproduction

1. Entrar no app e sair (`POST /auth/logout`) — a resposta devolve **200**.
2. Recarregar o app: `GET /auth/status` responde **`authenticated: true`** (a sessão **não** terminou).
3. Tentar salvar um card → **403 CSRF inválido**.

## Evidence (log de produção, sem valores sensíveis)

```
POST /auth/logout   200      (repetidas vezes)
GET  /auth/status   200      (ainda autenticado!)
GET  /boards        200
POST /cards         403
[csrf-diag] POST /cards cookie_present=False header_present=False cookies=['session']
            origin=http://192.168.3.8:5173
```

O navegador envia **apenas** o cookie `session`: o `csrf_token` simplesmente não existe mais.

## Suspected Code Paths

- `backend/app/api/middleware.py:21` — `SessionMiddleware.dispatch`: renova o cookie de sessão
  **depois** de `call_next()`, isto é, também na resposta do logout.
- `backend/app/api/routes_auth.py:` `logout_route` — apaga `session` **e** `csrf_token`.
- `frontend/src/services/api.ts:13` — `csrfHeaders()`: lê o cookie `csrf_token`; sem cookie,
  devolve `{}` e nenhum cabeçalho é enviado.

## Root Cause Hypothesis

**Confiança: alta.** A resposta do logout carrega três `Set-Cookie`, nesta ordem:

1. `session=<expirado>` — apagado pela rota (`delete_cookie`)
2. `csrf_token=<expirado>` — apagado pela rota (`delete_cookie`)
3. `session=<novo>; Max-Age=7776000` — **renovação do middleware, que roda após a rota**

O navegador aplica na ordem recebida: a **sessão volta a valer** e o **CSRF continua apagado**.
Sem o cookie, o frontend não tem token para pôr no cabeçalho → toda requisição de escrita
(a única fora de `/auth` é `POST /cards`) leva 403.

Bug **pré-existente** (a renovação existe desde a feature 003); não foi introduzido pela
remoção de aparelhos da 005 — a 005 apenas o tornou visível ao remover o cookie de aparelho.

## Proposed Remediation

**Preferred**:

1. A rota de logout marca a requisição (`request.state.session_ended = True`) e o
   `SessionMiddleware` **não renova** os cookies quando essa marca existe.
2. A renovação passa a reemitir **também o cookie CSRF**, com o **mesmo valor** recebido
   (e um novo, se estiver ausente). Hoje ele nunca é renovado: se expirar enquanto a sessão
   desliza (90 dias de uso contínuo), o app fica permanentemente incapaz de escrever.
   Reemitir o mesmo valor não enfraquece a proteção (continua sendo cookie+header iguais).

**Alternativas**:

- Não renovar quando a resposta já contém `Set-Cookie` de sessão — frágil (exigiria inspecionar
  cabeçalhos de resposta para distinguir "definir" de "apagar").
- Rotacionar o token CSRF a cada requisição — cria corrida: uma requisição em voo leria o valor
  antigo (ou o novo) e passaria a falhar de forma intermitente. **Rejeitada.**

**Files likely to change**:

- `backend/app/api/middleware.py`
- `backend/app/api/routes_auth.py`
- `backend/tests/test_routes_auth.py`

**Tests to add or update**:

- `test_logout_really_ends_the_session` — depois do logout, `GET /version` deve responder `401`
  e o cookie de sessão deve sair do jar (hoje falha — é a regressão do bug).
- `test_csrf_cookie_is_reissued_on_authenticated_requests` — com o cookie CSRF removido, uma
  requisição autenticada o reemite (auto-cura).

## Risks & Considerations

- Reemitir o CSRF com o mesmo valor não abre brecha: a defesa continua sendo cookie+header
  coincidentes e legíveis apenas pela origem do app; o cookie de sessão é `SameSite=Strict`.
- Um cliente que já esteja no estado quebrado (sessão válida, sem CSRF) se recupera sozinho na
  primeira requisição, sem precisar sair e entrar.
- O middleware passa a emitir 2 `Set-Cookie` por resposta autenticada em vez de 1 (desprezível).

## Open Questions

Nenhuma.
