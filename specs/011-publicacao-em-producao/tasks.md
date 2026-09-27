# Tasks: Publicação em produção (VPS por IP, HTTPS confiável)

**Input**: Design documents from `/specs/011-publicacao-em-producao/`
**Prerequisites**: plan.md, spec.md, research.md

**Tests**: infraestrutura não tem teste unitário honesto (desvio registrado no plan.md/research.md D5). A
verificação é: validação da configuração, suíte existente (não-regressão) e os passos verificáveis do
roteiro.

**Organization**: US1/US2 (P1) — publicar e manter publicado; US3/US4 (P2) — reverter e atualizar.

## Phase 1: Setup

- [x] T001 Confirmar ponto de restauração: árvore limpa, `v0.11.0` publicado, daemon do Docker **parado**
  (limitação registrada na FR-013).
- [x] T002 `.dockerignore`: revisar o que precisa passar a importar (hoje `docs`, `specs`, `README`
  ficam de fora — correto — mas o **build do frontend** roda dentro do Docker e precisa de `frontend/`;
  conferir que `node_modules`, `dist` e `.env` continuam fora).

## Phase 2: Imagens e pacote (bloqueia as duas histórias P1)

- [x] T003 `backend/Dockerfile`: imagem do servidor em Python 3.12-slim, dependências instaladas com
  **hashes** (`--require-hashes`), layout do repositório preservado (`/app/backend/app` + `/app/VERSION`,
  exigência do `config.py`), usuário **não-root**, `EXPOSE 8000`, sem `--reload`.
- [x] T004 `frontend/Dockerfile`: estágio de build (Node, `npm ci`) → estágio `nginx:alpine` com o `dist`
  copiado, as duas configurações de proxy e o seletor de modo.
- [x] T005 `deploy/nginx/tls.conf`: 443 com o certificado do IP, interface estática, `/api` → `backend:8000`
  (mesma regra de rewrite do proxy de desenvolvimento), desafio ACME em 80, redirect HTTP→HTTPS,
  cabeçalhos de segurança (HSTS) nos estáticos (D7) e sem publicar o servidor.
- [x] T006 `deploy/nginx/bootstrap.conf`: modo **pré-certificado** — só porta 80 servindo o desafio ACME.
- [x] T007 `deploy/proxy-entrypoint.sh`: escolhe bootstrap ou TLS conforme o certificado existir; sobe o
  nginx e pronto.
- [x] T008 `deploy/compose.yaml`: `backend` (env_file do servidor, `COOKIE_SECURE=true`, volume do hash de
  senha, healthcheck) + `proxy` (80/443 publicadas) + `certbot` sob demanda (perfil `tools`), sem socket
  do Docker.
- [x] T009 `deploy/.env.example`: variáveis esperadas no servidor (**sem valores**) + `PUBLIC_HOST` (o IP).

## Phase 3: US1 — publicar e acessar (P1) 🎯 MVP

- [x] T010 `deploy/scripts/first-publish.sh`: primeira publicação em **um comando** (sobe backend+proxy em
  modo bootstrap → emite o certificado do IP por HTTP-01 webroot → reinicia o proxy em modo TLS →
  verifica `GET /health`).
- [x] T011 `deploy/scripts/publish.sh`: publicações seguintes a partir de uma **tag** (checkout + build +
  subida + verificação), preservando segredos e volume.
- [x] T012 `specs/011-publicacao-em-producao/quickstart.md`: roteiro do dono (pré-requisitos, primeira
  publicação, publicar tag nova, verificar, reverter, o que fazer quando o IP muda, o que **nunca** fazer).

## Phase 4: US2 — o certificado se cuida sozinho (P1)

- [x] T013 `deploy/scripts/renew.sh`: renovação por webroot + reload do proxy (sem downtime) + registro em
  log; idempotente e seguro para rodar em cron.
- [x] T014 Roteiro: agendamento da renovação (cron do usuário de deploy, duas vezes ao dia) e **como
  conferir** que ela aconteceu (`certbot certificates`, log) — base do SC-006.
- [x] T015 Perfil `shortlived`: o roteiro consulta a lista oficial de perfis no diretório ACME antes de
  fixar o parâmetro, e registra o resultado (o perfil pode estar em liberação gradual) — D3.

## Phase 5: US3/US4 + convergência

- [x] T016 Reversão: **sem script novo** — é o `publish.sh` com a tag anterior (o roteiro documenta as duas
  formas, publicar e reverter, no mesmo comando), em ≤5 min (SC-005).
- [x] T017 `README.md`: substituir a seção de produção atual (que tem o passo em branco) pelo roteiro real,
  com os avisos de segurança (UFW x portas publicadas, `docker compose down -v` apaga o volume da senha).
- [x] T018 Validação: `docker compose config` (sintaxe e referências) + suíte completa (backend, unidade,
  E2E) para provar **0 regressão** (SC-007) + `gitleaks`.
- [x] T019 Convergir e reportar: o que foi **verificado aqui** (configuração, suíte) e o que **só o dono
  pode verificar** no servidor (SC-001, SC-002, SC-004, SC-006) — o status honesto é "entregue, com
  verificação em produção pendente do dono", **não** "Converged". Depois: gancho de release (A9).

## Revisão depois da publicação real (2026-09-27)

A primeira publicação mostrou que **não existe certificado público para IP puro** (o Certbot recusou; ver
`research.md` D8 e `docs/adr/0005-acesso-por-rede-privada.md`). O que mudou em relação às tasks acima:

- **T005/T006 (configurações do proxy)**: as duas (TLS e bootstrap) foram substituídas por **uma**,
  `deploy/nginx/app.conf` — HTTP interno, sem bloco 443, sem desafio ACME e sem redirecionamento.
- **T007 (seletor de modo do proxy)**: **removido**. Não existe mais "modo bootstrap" nem "modo TLS" —
  o TLS é do `tailscaled`.
- **T010 (primeira publicação)**: reescrito — sem emissão de certificado: sobe o pacote, verifica
  `/api/health` de dentro da máquina e publica no tailnet (`tailscale serve`).
- **T013/T014 (renovação agendada + cron)**: **removidos**. O certificado é gerenciado pelo Tailscale; não
  existe `renew.sh` nem cron nosso.
- **T015 (perfil `shortlived`)**: **removido** — deixou de existir perfil ACME no projeto.
- **T002/T009 (`.env`)**: saíram `PUBLIC_HOST` e `CERTBOT_PROFILE`; entrou `deploy/.env.example` sem
  variáveis de TLS.
- **Novo**: `deploy/scripts/setup-tailscale.sh` (instalar, conectar e publicar no tailnet) e dois passos no
  roteiro que não existiam (habilitar **HTTPS Certificates** e **desativar Key expiry** do nó).
- **T018 (validação)**: foi além do previsto — o agente construiu as imagens e subiu o pacote localmente
  (as duas modalidades do proxy na primeira versão e, agora, o proxy HTTP interno respondendo em
  `127.0.0.1`), além de `docker compose config` e da suíte completa.
- **T019 (convergência honesta)**: **atualizada em 27/09/2026** — o dono publicou e confirmou em produção:
  o app abre no celular **sem aviso de segurança** e um card foi criado, de ponta a ponta. Verificados:
  **SC-001, SC-002 e SC-003**; **SC-007** pelo agente. Continuam **pendentes de observação** e **não**
  declarados cumpridos: **SC-004** (voltar sozinho após reiniciar o servidor) e **SC-006** (certificado sem
  expirar ao longo do tempo) — os passos de conferência estão no `quickstart.md`.


- T003–T009 antes de T010/T011; T012 depende de T010/T011; T013/T014 dependem de T011 (proxy no ar).
- T016 depende de T011 (existe algo publicado e uma tag anterior).
- T019 é o último (não declarar concluído o que não foi observado).

## Parallel Example

```bash
# Independentes: imagem do servidor, imagem da interface, configurações de proxy e roteiro.
# (arquivos distintos, sem sobreposição)
```

## Implementation Strategy

MVP = Phase 2 + 3 (publicar de ponta a ponta e abrir no celular). A Phase 4 é a manutenção silenciosa
(certificado de curta duração), e a Phase 5 fecha reversão, documentação e a convergência **honesta**:
entrega completa, verificação de produção pendente do dono (A11 impede o agente de executar).
