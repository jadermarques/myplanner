# ADR 0005 — Acesso por rede privada (Tailscale) em vez de certificado público de IP

**Status**: Aprovado | **Date**: 2026-09-27 | **Revisa**: S7 (`docs/RULES.md`) e A8 (`AGENTS.md`)

## Contexto

A publicação em produção (feature `011-publicacao-em-producao`) foi especificada em cima da A8: HTTPS
obrigatório "mesmo acessando só por IP", com certificado **Let's Encrypt de IP** (perfil shortlived) e
renovação automática.

Na primeira publicação real (v0.12.0, 27/09/2026), o Certbot **recusou** a emissão:

```
Requested name 164.163.11.58 is an IP address.
The Let's Encrypt certificate authority will not issue certificates for a bare IP address.
```

A premissa é **falsa**. O RFC 8738 define o identificador `ip` e admite os desafios `http-01` e
`tls-alpn-01`; a documentação do Certbot fala em "domínio **ou endereço IP**". Mas a **CA real não emite**
para IP puro, para contas comuns — a própria página de perfis do Let's Encrypt ressalva que alguns perfis
ficam "locked behind an allowlist so we can roll them out slowly". Documentação de protocolo e de cliente
não provam disponibilidade de emissão; isso se confirma emitindo.

Restaram três caminhos: dar um **nome** ao servidor e emitir certificado normal; **trazer a confiança**
para o cliente, instalando uma autoridade certificadora própria no celular; ou **sair da exposição
pública**, servindo o app por uma **rede privada**.

Peso decisivo nessa escolha: o **ADR 0004** optou por senha única, **sem** segundo fator e **sem** bloqueio
por tentativas. Expor esse login à internet é oferecer força bruta ilimitada contra a única credencial do
app.

## Opções

1. **Domínio/subdomínio (DuckDNS ou próprio) + Certbot.** Funciona e é o caminho clássico. Exige abrir
   80/443 e mantém o login **exposto ao mundo**; o subdomínio grátis tem nome feio e mais um terceiro na
   dependência; o pacote atual (Nginx + Certbot + bootstrap) já serve.
2. **Autoridade certificadora própria instalada no celular.** Sem domínio e sem terceiros. Em troca:
   instalar a raiz e **habilitar confiança total** em cada aparelho (passo escondido no iOS/Android),
   guardar uma chave de autoridade, refazer tudo em aparelho novo.
3. **Rede privada com Tailscale + `tailscale serve`** (esta decisão). O Tailscale emite certificado
   **Let's Encrypt para o nome do nó (`*.ts.net`)**, validando por **DNS-01** (ele cria o registro TXT no
   ts.net) — **sem abrir porta nenhuma**; o `serve` publica HTTPS **apenas para os aparelhos do tailnet** e
   com `-bg` volta sozinho depois de reiniciar.

## Decisão

Adotar a **opção 3**.

- O app é publicado em `https://<host>.<tailnet>.ts.net`, com certificado válido e renovação gerenciada
  pelo `tailscaled` — sem Certbot, sem cron de renovação, sem volume de certificado e sem modo bootstrap.
- **Nenhuma porta vai para a internet**: o proxy escuta apenas no loopback (`127.0.0.1:80`) e quem fala
  com ele é o `tailscaled`, na mesma máquina.
- Quem não está no tailnet **não alcança** o app. Isso é o que compensa a ausência de segundo fator e de
  bloqueio por tentativas (ADR 0004).
- HTTPS continua obrigatório na ponta que o navegador vê (S7 mantida no espírito). O trecho interno
  `tailscaled → proxy` é HTTP em loopback e nunca sai da máquina.
- Nada de certificado público de IP, nada de CA própria, nada de domínio.

## Consequências

- **Segurança**: superfície pública igual a zero portas; o login deixa de ser alvo de varredura e de força
  bruta. Ganho líquido, alinhado ao princípio de expor só o necessário.
- **Simplicidade**: saem o Certbot, o volume de certificado, o `renew.sh`, o `proxy-entrypoint.sh` (seletor
  bootstrap/TLS) e a necessidade de domínio. O pacote fica menor e a publicação deixa de ter "dois atos".
- **Custos novos**: cada aparelho precisa do app do Tailscale conectado; o acesso passa a depender do
  serviço do Tailscale (plano pessoal gratuito) e o roteiro ganha dois passos que não existiam (habilitar
  certificados HTTPS no tailnet e **desativar a expiração de chave do nó** do servidor).
- **Documentação que passaria a mentir se não for atualizada no mesmo commit**: `AGENTS.md` (A8),
  `docs/RULES.md` (S7), `docs/SECURITY.md`, `README.md` e o `quickstart.md` da 011.
- **Reversão**: as opções 1 e 2 seguem viáveis. A configuração anterior (Nginx + Certbot + 80/443
  publicadas) está no histórico do Git e na tag `v0.12.0`.

## Pendência de governança

Alterar a **A8** é mexer na **constituição**: só acontece com aprovação explícita do dono. O texto
proposto acompanha o commit desta decisão.
