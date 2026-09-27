# Research: Publicação em produção

**Feature**: `011-publicacao-em-producao` | **Date**: 2026-09-27

## D1 — Proxy: **Nginx + Certbot** (fecha o item em aberto da A8)

- **Verificado na documentação**: o Caddy serve **endereços IP** com **certificado autoassinado**
  ("Caddy serves IP addresses ... using self-signed certificates that are automatically trusted
  locally"). Isso produz exatamente o que a spec proíbe: **aviso de segurança no celular** — e, pior,
  quebraria cookies `Secure` (S3/S7).
- **Verificado na documentação do Certbot**: ele suporta **identificador de IP** (as variáveis de hook
  falam em "the domain **or IP address** being authenticated"; o nome antigo `CERTBOT_DOMAIN` foi
  substituído por `CERTBOT_IDENTIFIER` justamente por causa disso).
- **Decisão**: **Nginx** servindo a interface e encaminhando `/api` + **Certbot** emitindo o certificado
  do IP. Descartado: Caddy (mais simples, mas não resolve o IP); só proxy de aplicação sem CA pública
  (aviso de segurança ✗).

## D2 — Desafio: **HTTP-01 por webroot** (renovação sem downtime)

- **Verificado no RFC 8738** (Tabela 1 do IANA): para o tipo de identificador `ip` são válidos
  **`http-01`** e `tls-alpn-01`.
- **Decisão**: validar por **HTTP-01** na porta 80, com o Nginx servindo o desafio por webroot.
- **Por quê**: o `tls-alpn-01` precisaria da **443 livre**, o que exigiria **derrubar o proxy por alguns
  segundos a cada renovação** (a cada ~6 dias). Com HTTP-01 a renovação é **invisível** para quem está
  usando o app. Efeito colateral bom: `http://<IP>` passa a redirecionar para HTTPS (digitar só o IP no
  navegador funciona).
- **Correção de requisito**: o SC-003 estava estrito demais ("0 portas além de HTTPS e SSH"). A porta 80
  é **necessária** para validar o certificado do IP e para o redirecionamento — a spec foi ajustada, com
  o resto do tráfego proibido (só invólucro para o desafio e redirect; nada de aplicação em HTTP).
- **Alternativa registrada**: `tls-alpn-01` (se um dia a porta 80 não puder ser aberta), aceitando o
  downtime curto e documentado.

## D3 — Certificado de curta duração e renovação

- O certificado por IP usa o perfil **`shortlived`** (validade de poucos dias). **Não** verificável
  daqui com certeza (o perfil pode estar sob liberação gradual/allowlist), então o roteiro **consulta a
  lista oficial** — o endpoint de diretório ACME do Let's Encrypt é a fonte canônica dos perfis
  disponíveis — antes de fixar o parâmetro; e é o próprio roteiro que confirma no servidor.
- **Decisão**: renovação **agendada** (duas vezes ao dia, o padrão recomendado), com gancho que recarrega
  o proxy, e **verificação visível**: `certbot certificates` mostra a validade e o log de renovação
  registra cada ciclo. É assim que o SC-006 vira verificável em dois ciclos.

## D4 — Formato da imagem e o que precisa persistir

- `backend/app/config.py` calcula a raiz do repositório **a partir da localização do arquivo** e lê `.env`
  dessa raiz. Portanto a imagem mantém o **mesmo layout** (`/app/backend/app`, `/app/VERSION`); em
  produção os segredos chegam como **variáveis de ambiente** (que têm precedência sobre `.env`) — assim
  **não existe** `.env` dentro da imagem (FR-004).
- **Persistente (volume)**: `backend/.data` (hash da senha criado no primeiro acesso). Sem isso, um
  rebuild apagaria a senha e obrigaria a definir outra — violaria FR-006.
- O `VERSION` precisa entrar na imagem: o rodapé do app e o `GET /version` leem esse arquivo (FR-009).

## D5 — Como verificar o que não tem teste unitário (ajuste do Princípio III)

- Infraestrutura não tem teste unitário honesto aqui. A verificação fica em três camadas, registradas
  como **desvio consciente** no `plan.md`:
  1. **Validação da configuração** antes de subir (`docker compose config`) — pega erro de sintaxe e de
     referência entre serviços;
  2. **Suíte existente** (backend + unidade + E2E) para provar **não-regressão** do app;
  3. **Passos verificáveis no roteiro**: resposta de `GET /health`, redirecionamento HTTP→HTTPS,
     certificado válido (`curl -vI https://<IP>`), e o teste real no celular.
- **Limitação assumida e declarada**: nesta máquina o **daemon do Docker está parado**, então a validação
  de *subida* dos containers não pode ser executada pelo agente — só a de sintaxe. A subida é verificada
  pelo dono, no servidor, seguindo o roteiro.

## D6 — Publicação manual por tag, sem CI/CD

- **Decisão**: publicar = `git fetch --tags` + `git checkout <tag>` + `docker compose up -d --build`;
  reverter = o mesmo com a tag anterior. Sem pipeline, sem orquestrador.
- **Por quê**: um usuário publicando às vezes não justifica CI/CD (A6 — nada por precaução). O gatilho
  para reavaliar seria passar a publicar com frequência ou ter mais de uma pessoa publicando.

## D7 — Cabeçalhos de segurança nos arquivos estáticos

- Os cabeçalhos (CSP/HSTS) são aplicados pelo middleware do FastAPI, que **não vê** os arquivos estáticos
  servidos pelo proxy. **Decisão**: o Nginx aplica HSTS e cabeçalhos básicos também no conteúdo estático,
  para que o PWA inteiro herde a política (S7).

## D8 — **Falsificação**: o certificado público de IP não existe (corrige D1/D2/D3)

- **O que aconteceu na primeira publicação real** (v0.12.0, 27/09/2026, servidor do dono): o Certbot
  recusou a emissão, duas vezes (com e sem `--preferred-profile`), com esta mensagem, transcrita:

  ```
  Requested name 164.163.11.58 is an IP address.
  The Let's Encrypt certificate authority will not issue certificates for a bare IP address.
  ```

  O cliente recusa **antes mesmo do desafio** — não foi firewall, não foi perfil, não foi a porta 80.
- **Onde este research errou (D1/D2/D3 estão superados)**: eu inferi suporte de IP do RFC 8738 (que
  define o identificador `ip` e admite `http-01`/`tls-alpn-01`) e da documentação do Certbot (que fala em
  "domínio **ou endereço IP**"). Faltou verificar **disponibilidade de emissão na CA real** — e a própria
  página de perfis do Let's Encrypt ressalva que alguns perfis ficam "locked behind an allowlist so we can
  roll them out slowly". *Lição registrada: documentação de protocolo e de cliente não provam que uma CA
  emite; isso se confirma emitindo, não deduzindo.*
- **Decisão nova (com o dono)**: acesso por **rede privada com Tailscale**, registrada em
  `docs/adr/0005-acesso-por-rede-privada.md`. Fatos verificados na documentação do Tailscale, que
  sustentam a decisão:
  - certificado **Let's Encrypt para nomes `*.ts.net`**, resolvido por **DNS-01** (o Tailscale cria o
    registro TXT no ts.net) → **nenhuma porta precisa ser aberta** para validar;
  - `tailscale serve` entrega HTTPS com **certificado válido**, apenas para os aparelhos **dentro** do
    tailnet (o modo público é o `funnel`, que não usamos);
  - com `-bg`, o `serve` **retoma sozinho depois de reiniciar** a máquina;
  - o certificado é gerenciado pelo `tailscaled` (com status no console). O caminho `tailscale cert`
    (arquivo em disco) **não** é usado, porque nele a renovação passaria a ser nossa responsabilidade.
- **Efeito no pacote**: saem o Certbot, o volume de certificado, o `renew.sh`, o `proxy-entrypoint.sh`
  (seletor bootstrap/TLS) e a necessidade de `PUBLIC_HOST`. O proxy passa a servir **só HTTP no loopback**
  (`127.0.0.1:80`) e o TLS é do `tailscaled`. Ganho colateral: **superfície pública zero**, o que protege
  o login sem segundo fator e sem bloqueio por tentativas (ADR 0004).

