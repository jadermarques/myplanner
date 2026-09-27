# Segurança — myplanner

## Modelo de ameaças

- App pessoal de usuário único, acessado por IP via HTTPS.
- Ativos: token do Trello, credenciais de login, sessão.
- Ameaças: vazamento de segredo, brute-force de login (sem mitigação por bloqueio — ADR 0004),
  sessão roubada, CSRF, MITM.

## Autenticação (usuário único)

- Senha forte → hash Argon2id.
- **Somente a senha**: não há segundo fator (TOTP) nem lista/revogação de aparelhos.
- **Não há bloqueio por tentativas falhas** — cada tentativa é avaliada de forma independente.
  Risco assumido conscientemente pelo dono (ADR 0004): a defesa contra força bruta passa a
  depender exclusivamente da força da senha e do HTTPS.
- Sessão de 90 dias renovada a cada uso, cookie `HttpOnly`, `Secure`, `SameSite=Strict`.
- CSRF + cabeçalhos de segurança (CSP, HSTS).

## Por que não passkey/WebAuthn

- Não funciona em acesso por IP.

## HTTPS

- Obrigatório, mesmo por IP: certificado Let's Encrypt de IP (perfil shortlived, ~6 dias)
  com renovação automática. Escolha do proxy (Certbot + Nginx ou Caddy) é item de
  `research.md` na spec 002.

## Segredos

- Somente em `.env` (nunca versionado; listado em `.gitignore` e `.dockerignore`).
- `.env.example` sem valores é versionado.

## Logs

- Nunca registrar senha, token, segredo, cookie ou dados pessoais (e-mail, telefone, CPF)
  em texto plano, nem em desenvolvimento.

## Rede de segurança Git

- Commit (ponto de restauração) antes de intervenção complexa.
- Experimentos só em branch ou worktree separada.
- `pre-commit` com gitleaks, lint e testes rápidos.
