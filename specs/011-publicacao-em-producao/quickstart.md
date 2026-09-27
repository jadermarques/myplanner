# Quickstart / Roteiro do dono: publicar o app na VPS (acesso por rede privada)

**Feature**: `011-publicacao-em-producao` | **Revisão**: 2026-09-27 (ADR 0005 — o certificado de IP
não existe; ver `research.md`, D8)

> **Quem executa é você.** O agente **não** executa deploy nem altera o servidor (A11).

## O que mudou em relação à primeira tentativa

O Let's Encrypt **não emite certificado para IP puro** — o Certbot recusou a emissão no servidor real. A
solução é **rede privada com Tailscale**: o app fica em `https://<nome-do-nó>.<seu-tailnet>.ts.net`, com
certificado válido gerenciado pelo próprio Tailscale, e **nenhuma porta do app é publicada para a
internet**. Se preferir entender o porquê antes de seguir, veja `docs/adr/0005-acesso-por-rede-privada.md`.

## Pré-requisitos (uma vez)

1. VPS com Docker e o usuário `deploy` (passos 1–3 do `README.md`).
2. Repositório em `/opt/myplanner` na tag desejada (passo 5 do `README.md`).
3. **Conta no Tailscale** — gratuita, em `login.tailscale.com`.
4. **App do Tailscale no celular** (Play Store / App Store), entrando na **mesma conta**.

**Não é preciso abrir nenhuma porta** — nem 80, nem 443. Esse é o ganho principal desta mudança.

## Passo 1 — Segredos (só no servidor)

```bash
cd /opt/myplanner/deploy
cp .env.example .env
python3 -c "import secrets; print('SESSION_SECRET=' + secrets.token_urlsafe(32))"
nano .env
```

Preencha **três** linhas (os valores do Trello são os mesmos que já funcionam no seu app):

```ini
TRELLO_API_KEY=<cole o seu>
TRELLO_TOKEN=<cole o seu>
SESSION_SECRET=<cole o valor gerado acima>
APP_PASSWORD_HASH=            ← deixe vazio: o app cria no primeiro acesso
```

Salve (**Ctrl+O**, **Enter**, **Ctrl+X**) e confira sem imprimir segredo:

```bash
chmod 600 .env
grep -q '^TRELLO_TOKEN=..' .env && echo 'TRELLO_TOKEN preenchido'
grep -q '^SESSION_SECRET=..' .env && echo 'SESSION_SECRET preenchido'
```

> Se o seu `.env` já existe da tentativa anterior, ele deve ter `PUBLIC_HOST=...` e talvez
> `CERTBOT_PROFILE=...`: **as duas ficaram órfãs** e podem ser apagadas — não são mais usadas.

## Passo 2 — Tailscale: instalar, conectar e publicar (uma vez)

```bash
deploy/scripts/setup-tailscale.sh
```

1. O script instala o Tailscale e pede para **conectar**: ele imprime um **link** — abra no navegador e
   autorize este servidor no seu tailnet.
2. No fim ele publica o app e mostra o endereço, algo como
   `https://locacloudjader26.<seu-tailnet>.ts.net/`.
3. **Dois ajustes no console** (`login.tailscale.com`), se ainda não fez:
   - **DNS → HTTPS Certificates: habilitar.** É isto que dá o **certificado válido** (sem isso o navegador
     mostra aviso de segurança);
   - **Máquinas → nó deste servidor → desativar "Key expiry"**. Sem isso o servidor sai da rede sozinho
     depois de alguns meses.

## Passo 3 — Primeira publicação do app

```bash
deploy/scripts/first-publish.sh
```

Na ordem, ele: sobe `backend` e `proxy` (o proxy escuta **só** em `127.0.0.1:80`), confirma de dentro da
máquina que `/api/health` responde **200** e publica o app no tailnet.

Conferência, no próprio servidor:

```bash
docker compose ps
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1/api/health   # espera 200
tailscale serve status                                                    # mostra o endereço HTTPS
```

## Passo 4 — No celular

1. Instale o **app do Tailscale** e conecte com a mesma conta (deixe ligado).
2. Abra o endereço mostrado — **sem tela de aviso de segurança**.
3. Defina a senha no primeiro acesso e **instale como app** na tela inicial.
4. Crie um card e confira no Trello.

## Publicar versões novas / reverter

```bash
cd /opt/myplanner
deploy/scripts/publish.sh v0.13.0     # publicar uma versão
deploy/scripts/publish.sh v0.12.0     # reverter para a tag anterior (mesmo comando)
```

Segredos e o volume do app (hash da senha) não são tocados; a sessão de 90 dias continua válida.

## Diagnóstico

```bash
cd /opt/myplanner/deploy
docker compose ps
docker compose logs --tail=60 proxy backend
tailscale status
tailscale serve status
```

| Sintoma | Causa provável |
|---|---|
| `https://...ts.net` não abre no celular | app do Tailscale desconectado, ou o aparelho não está no tailnet |
| Abre, mas com aviso de segurança | **HTTPS Certificates** não habilitado no console do Tailscale |
| O servidor desaparece da rede depois de meses | **Key expiry** não foi desativada no nó |
| Página abre mas o app não carrega os dados (erro genérico) | `docker compose logs backend` e `curl http://127.0.0.1/api/health` |

## Quando o IP do servidor mudar

**Nada a fazer no certificado**: o nome é do **nó** na rede privada, não do endereço. O Tailscale
reconecta sozinho.

## Nunca fazer

- `docker compose down -v` — apaga os volumes, incluindo o **hash da senha** (você teria de definir outra).
- Publicar porta do app (`-p 80:80` / `-p 443:443`) — ficar invisível na internet é o objetivo.
- Commitar `deploy/.env` ou colar segredos em issue/chat/log.

## Limitação desta entrega (honestidade de escopo)

O agente validou o que dava **na máquina de desenvolvimento**: as duas imagens construídas, o app subindo e
respondendo em `127.0.0.1`, o proxy em modo HTTP interno e a suíte completa de testes verde (0 regressões).
O agente **não** executa deploy (A11), e a parte do Tailscale depende da sua conta — então a verificação de
ponta a ponta (SC-001, SC-002, SC-004, SC-006) é feita por você, com os passos acima.
