# Quickstart / Roteiro do dono: publicar o app na VPS

**Feature**: `011-publicacao-em-producao` | **Date**: 2026-09-27

> **Quem executa é você.** O agente **não** executa deploy nem altera o servidor (A11). Estes comandos
> são para rodar **na VPS**, como o usuário `deploy`.

## Pré-requisitos (uma vez)

1. VPS Ubuntu com **Docker Engine + plugin Compose** (passos 1–3 do `README.md`).
2. Usuário `deploy` (no grupo `docker`) e `/opt/myplanner` (passos 2–3 do `README.md`).
3. **IP público fixo** e as portas **80 e 443 liberadas** no firewall do provedor.
   Aviso do `README.md`: **porta publicada no Docker ignora o UFW** — por isso o pacote publica
   *somente* 80 e 443; o servidor (8000) nunca é exposto.
4. Repositório no servidor:

   ```bash
   git clone git@github.com:jadermarques/myplanner.git /opt/myplanner
   cd /opt/myplanner
   git fetch --tags && git checkout v0.12.0
   ```

## Passo 1 — Segredos (só no servidor)

```bash
cd /opt/myplanner/deploy
cp .env.example .env
nano .env          # preencha PUBLIC_HOST (o IP), TRELLO_API_KEY, TRELLO_TOKEN, SESSION_SECRET
```

`SESSION_SECRET` novo: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`.
`APP_PASSWORD_HASH` pode ficar **vazio**: o app cria no primeiro acesso (fica no volume `app_data`).
`deploy/.env` **nunca** vai para o Git e **nunca** entra na imagem (FR-004).

## Passo 2 — Primeira publicação (um comando)

```bash
deploy/scripts/first-publish.sh
```

O que ele faz, em ordem (é só isso, sem mágica):
1. sobe `backend` e `proxy` — o proxy detecta que ainda **não há certificado** e sobe em **modo bootstrap**
   (porta 80 servindo só o desafio do certificado; nada do app em HTTP);
2. emite o certificado **do IP** pelo Certbot, validando por **HTTP-01** (o RFC 8738 permite identificador
   de IP nesse desafio) — usa o perfil `shortlived` e, se ele não estiver disponível para a sua conta,
   **reemite com o perfil padrão**, avisando no terminal;
3. reinicia o `proxy`: agora ele encontra o certificado e sobe em **modo TLS**;
4. mostra o estado dos serviços.

## Passo 3 — Conferir no celular

1. No navegador do celular, digite **`https://<SEU-IP>`** (com o `https://` escrito — é o que evita o
   caminho HTTP) e confirme que **não aparece aviso de segurança** (SC-003).
2. Defina a senha no primeiro acesso e entre.
3. **Instale como app** (tela inicial). O ícone abre em tela cheia e continua falando com o servidor.
4. Crie um card e confira no Trello.

Verificações de linha de comando, se quiser confirmar antes:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://<SEU-IP>/api/health   # espera 200
curl -sSI https://<SEU-IP>/ | head -1                                   # espera HTTP/2 200
docker compose run --rm certbot certificates                            # validade do certificado
```

## Passo 4 — Renovação automática (o certificado é de poucos dias)

```bash
crontab -e
```

```cron
17 3,15 * * *  /opt/myplanner/deploy/scripts/renew.sh
```

Como **conferir** que está renovando (SC-006):

```bash
tail -n 40 /opt/myplanner/deploy/renew.log       # cada ciclo registra data + validade atual
docker compose run --rm certbot certificates     # "Expiry Date" sempre à frente
```

A renovação é por **webroot**, com o proxy no ar: **sem downtime** e **sem deslogar** (a sessão de 90 dias
não depende do certificado).

## Publicar uma versão nova

```bash
cd /opt/myplanner && deploy/scripts/publish.sh v0.13.0
```

Segredos e volumes não são tocados; a sessão continua válida; o rodapé do app passa a mostrar a versão
nova (FR-006, FR-009).

## Reverter para a versão anterior (SC-005)

```bash
cd /opt/myplanner && deploy/scripts/publish.sh v0.12.0     # a tag anterior
```

## Quando o IP do servidor mudar

O certificado é do **endereço** antigo — ele deixa de valer. Refazer:

```bash
nano deploy/.env                     # atualize PUBLIC_HOST
deploy/scripts/first-publish.sh      # emite o certificado do IP novo
```

## Diagnóstico

```bash
docker compose ps                        # algo reiniciando? veja o healthcheck
docker compose logs -f proxy backend     # o proxy diz em qual modo subiu
docker compose run --rm certbot certificates
```

## Nunca fazer

- `docker compose down -v` — apaga os volumes, incluindo o **hash da senha** e o **certificado**.
- Publicar a porta **8000** ou qualquer outra além de 80/443.
- Commitar `deploy/.env` ou colar segredos em issue/chat/log.

## Limitação desta entrega (honestidade de escopo)

O agente validou o que dava **nesta máquina**: sintaxe/referências da configuração do compose e a suíte
completa de testes (0 regressões). O daemon do Docker está **parado** aqui e o agente **não** executa
deploy (A11), então a verificação de ponta a ponta — SC-001, SC-002, SC-004 e SC-006 — é feita por você,
com os passos acima. Só depois desses passos é justo dizer "Converged".
