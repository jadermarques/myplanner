# Implementation Plan: Publicação em produção (VPS por IP, HTTPS confiável)

**Branch**: `011-publicacao-em-producao` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-publicacao-em-producao/spec.md`

## Summary

Entregar o **pacote de produção** e o **roteiro**: imagens de containers para interface + servidor, um
proxy TLS na frente servindo a interface e encaminhando `/api` (mesma regra do proxy de desenvolvimento),
certificado Let's Encrypt **do IP** com renovação agendada, e um roteiro de publicar/verificar/reverter em
pt-BR. **O agente não executa o deploy** (A11): ele entrega os artefatos e o roteiro; quem roda no servidor
é o dono.

## Technical Context

**Language/Version**: Python 3.12 + Node 20 (build) + Nginx/Certbot como infraestrutura de produção

**Primary Dependencies**: as já existentes; **nenhuma dependência nova de aplicação**

**Testing**: suíte atual (114 + 50 + 31) para provar não-regressão + validação do pacote
(`docker compose config`) + verificação no servidor pelo dono (roteiro)

**Target Platform**: VPS Ubuntu (Docker + plugin Compose), acesso por **IP público** em `https://<IP>`

**Constraints**: só 443 (e SSH) expostas; `COOKIE_SECURE=true`; segredos apenas no servidor; certificado de
IP é de curta duração → renovação obrigatória e verificável; nenhum segredo na imagem ou no repositório

**Scale/Scope**: usuário único; 2 histórias P1 + 2 P2; ~6 arquivos de infraestrutura + 1 roteiro

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regra / Princípio | Resultado |
|-------------------|-----------|
| I (spec é o ativo principal) | ✅ spec 011 antes dos artefatos |
| II (specs pequenas) | ✅ uma preocupação: publicar e manter publicado |
| III (test-first) | ⚠️ adaptado: infraestrutura não tem teste unitário — a verificação é a **validação da configuração** + a **suíte existente** + o **roteiro com passos verificáveis** (ver `research.md` D5) |
| IV (segurança por padrão) | ✅ HTTPS obrigatório, `Secure` nos cookies, só 443 exposta, segredos fora da imagem |
| V (proporcionalidade) | ✅ sem CI/CD, sem orquestrador, sem dependência nova |
| VI (mobile-first e velocidade) | ✅ PWA servido pelo mesmo domínio/origem do `/api` |
| VIII (rastreabilidade) | ✅ cada passo do roteiro ligado a um FR/SC |
| A6 (gatilhos de ADR) | ✅ **nenhum ADR novo**: sem banco, sem IA, sem usuário novo, sem integração externa nova |
| A8 (proxy) | ✅ decisão fechada nesta feature (era item em aberto da spec 002) → D1 do `research.md` |
| A11 (limites do agente) | ✅ o agente **não** executa deploy; entrega artefatos e roteiro |
| O3/O6 (produção em Docker, deploy por tag, rollback) | ✅ é exatamente o que esta feature entrega |

*Re-check pós-Phase 1*: mantido ✅; a única adaptação (III) está justificada e aprovada com o dono.

## Project Structure

```text
deploy/
├── compose.yaml                    # proxy + servidor + (renovação) — publicação só na 443
├── .env.example                    # variáveis esperadas no servidor (sem valores)
├── nginx/default.conf              # TLS + interface estática + /api → servidor
├── certbot/issue-ip-cert.sh        # emissão inicial do certificado do IP
└── certbot/renew.sh                # renovação agendada (com o passo que libera a 443)

backend/Dockerfile                  # imagem do servidor (requirements com hashes)
frontend/Dockerfile                 # build do PWA → nginx:alpine (estático)
.dockerignore                       # já existe; revisar o que passa a importar
README.md                           # roteiro de publicação/verificação/reversão (pt-BR)

specs/011-publicacao-em-producao/
├── spec.md · plan.md · research.md · tasks.md · quickstart.md   # quickstart = roteiro do dono
└── checklists/
```

*(sem `contracts/` e sem `data-model.md`: esta feature não altera contrato HTTP nem o modelo de dados — o
único contrato novo é o do **roteiro**, que vive no `quickstart.md` e no `README.md`)*

## Complexity Tracking

| Desvio | Por que | Alternativa simples descartada |
|--------|---------|-------------------------------|
| Sem teste automatizado de infraestrutura (III) | Um teste "de verdade" exigiria Docker rodando em CI e um servidor falso; o valor está em validar configuração + suíte existente + roteiro verificável | Subir containers em teste local: pesado e frágil para um app de um usuário só |
| Roteiro em vez de script único | Alguns passos (emissão do certificado, cron) exigem acesso ao servidor e decisão do dono | Um `deploy.sh` que faz tudo às cegas esconderia os pontos que precisam de conferência |
