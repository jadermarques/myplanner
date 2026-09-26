# Research: Base mínima do app (shell PWA)

**Feature**: `001-app-shell` | **Date**: 2026-09-25

Resolve as decisões técnicas do Technical Context antes do design (Phase 1).

## 1. Ferramenta de PWA no frontend

- **Decision**: `vite-plugin-pwa` (Workbox) para gerar manifest + service worker + ícones.
- **Rationale**: integração nativa com Vite, mínimo de bibliotecas (regra de "poucas bibliotecas"), suporte a manifesto web + instalação + precache, padrão de mercado para PWAs em Vite/React.
- **Alternatives considered**:
  - `workbox-build` puro — mais controle, porém mais configuração manual (desnecessário aqui).
  - Service worker manual — reimplementar o que o plugin já faz; rejeitado (YAGNI).

## 2. Detecção de offline / conectividade

- **Decision**: combinar `navigator.onLine` (sinal imediato) com um ping ao `GET /health` do backend (sinal autoritativo). O aviso aparece quando o aparelho está offline OU o backend está inacessível.
- **Rationale**: `navigator.onLine` detecta a desconexão do aparelho, mas não detecta backend fora do ar; o ping ao `/health` cobre ambos os edge cases (aparelho sem internet + backend fora do ar).
- **Alternatives considered**:
  - Só `navigator.onLine` — não detecta backend fora do ar (edge case não coberto).
  - Só ping ao `/health` — não é necessário diferenciar "sem internet" de "backend down" nesta feature; a combinação dá o melhor custo/benefício.

## 3. Entrega da versão ao rodapé

- **Decision**: o backend lê o arquivo `VERSION` (fonte única) e expõe em `GET /version`; o frontend busca `/version` em runtime e exibe no rodapé.
- **Rationale**: mantém `VERSION` como fonte única (O4, princípio VIII); evita duplicar a versão no build do frontend; usa o mesmo backend que já serve `/health` (sinal de conectividade).
- **Alternatives considered**:
  - Injetar a versão no build (Vite lê VERSION) — duplica a fonte e exige rebuild para refletir mudança de versão; rejeitado.
  - Hardcode no frontend — viola fonte única; rejeitado.

## 4. Estrutura do backend (camadas)

- **Decision**: backend começa como módulo único (rotas + config + leitor de versão), sem as camadas `api → application → domain → infrastructure`.
- **Rationale**: a feature tem 2 endpoints read-only, sem regra de negócio além da "versão de fonte única" e sem integração. Introduzir camadas agora seria "por precaução" (princípio V / YAGNI).
- **Alternatives considered**:
  - Estrutura completa em 4 camadas desde já — viola proporcionalidade; rejeitada (documentada em Complexity Tracking).

## 5. Configuração tipada

- **Decision**: `pydantic-settings` lendo `config/app.yaml` (parâmetros não secretos) e o arquivo `VERSION`. Segredos ficam em `.env` (não usados nesta feature).
- **Rationale**: alinha com A6/A7 (config tipada, segredos só em `.env`); `app.yaml` já existe versionado.
- **Alternatives considered**:
  - `os.getenv`/leitura manual — sem validação tipada; rejeitado.
