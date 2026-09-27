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

- Não funcionava em acesso por IP *(nota de 2026-09-27: com o acesso por rede privada em `*.ts.net`, esse
  motivo específico deixa de valer — reabrir passkey seria assunto de um ADR novo; o **ADR 0004 continua
  valendo** e a decisão de senha única não muda por causa disto)*.

## HTTPS

- Obrigatório na ponta que o navegador vê, com certificado público válido.
- **Descoberta registrada**: o Let's Encrypt **não emite certificado para IP puro** — o Certbot recusa a
  emissão ("will not issue certificates for a bare IP address"). Ver o research D8 da feature 011 e o
  `docs/adr/0005-acesso-por-rede-privada.md`.
- **Solução adotada**: **rede privada (Tailscale)**. O app é servido em
  `https://<host>.<tailnet>.ts.net`, com certificado gerenciado pelo `tailscaled` (renovação automática,
  sem cron nosso e sem Certbot).
- **Nenhuma porta do app é publicada para a internet** (só o SSH da administração): o proxy escuta apenas
  no loopback (`127.0.0.1:80`) e quem fala com ele é o `tailscaled`. O trecho interno é HTTP em loopback e
  não sai da máquina.
- Efeito de segurança relevante: como o login **não fica exposto à internet**, a ausência de segundo fator
  e de bloqueio por tentativas (ADR 0004) deixa de ser um alvo alcançável de força bruta.

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
