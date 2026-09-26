# Research: Autenticação do usuário único

**Feature**: `003-autenticacao` | **Date**: 2026-09-25

## 1. Hash de senha — Argon2id

- **Decision**: `argon2-cffi` (Argon2id).
- **Rationale**: Argon2id é o exigido pela S2; `argon2-cffi` é direto e mantido.
- **Alternatives considered**: `passlib` (menos mantido), `pwdlib` (wrapper — desnecessário), `bcrypt` (não é Argon2id).

## 2. Sessão — cookie assinado stateless

- **Decision**: cookie assinado com `itsdangerous` (HMAC + `SESSION_SECRET`), contendo `expires_at`; renovado (sliding) a cada uso; flags `HttpOnly` + `SameSite=Strict` (e `Secure` em produção).
- **Rationale**: sem banco de dados, sessão stateless é a opção proporcional; assinatura impede adulteração; `SESSION_SECRET` em `.env`.
- **Alternatives considered**: JWT (sobre-engenharia), sessão server-side (precisa de estado/DB), starlette SessionMiddleware (menos controle sobre renewal).

## 3. CSRF — double-submit token

- **Decision**: token CSRF em cookie (não `HttpOnly`) + header; o servidor compara nos métodos de mutação.
- **Rationale**: padrão simples para cookie-session; protege POST/PUT/DELETE.
- **Alternatives considered**: synchronized token (precisa de estado server-side — rejeitado).

## 4. Bloqueio progressivo

- **Decision**: contagem de falhas em estado em memória (processo único) com `time.sleep`/espera progressiva: 5 falhas → 30 s, dobrando.
- **Rationale**: cumpre S5; para usuário único e dev local, em memória é suficiente.
- **Alternatives considered**: arquivo persistente (adicionaria estado — desnecessário agora).

## 5. Armazenamento do hash da senha

- **Decision**: arquivo de estado gitignorado (`backend/.data/password_hash`), escrito pelo fluxo "definir/trocar senha".
- **Rationale**: a senha é definida via UI (clarify), então o backend precisa persistir o hash; escrever em `.env` é atípico; um arquivo gitignorado é simples e proporcional.
- **Alternatives considered**: `.env` (o app escreveria em `.env` — atípico), banco de dados (fora de escopo).

## 6. Cabeçalhos de segurança

- **Decision**: middleware adicionando CSP, X-Content-Type-Options, etc.; HSTS apenas em produção (HTTPS).
- **Rationale**: cumpre S6; HSTS em dev HTTP quebraria o navegador.
- **Alternatives considered**: nenhum (requisito).
