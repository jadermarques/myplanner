# Research: Aparelhos e TOTP

**Feature**: `004-dispositivos` | **Date**: 2026-09-25

## 1. TOTP — biblioteca e validação

- **Decision**: `pyotp`, com `valid_window=1` (±1 período de 30 s).
- **Rationale**: biblioteca padrão de TOTP em Python; a janela ±1 tolera pequeno desalinhamento de relógio (clarify).
- **Alternatives considered**: implementação manual (arriscada), `onetimepass` (menos usado).

## 2. Identificação do aparelho

- **Decision**: o servidor gera um `device_id` (token aleatório), guarda-o em arquivo gitignorado e o envia em cookie `HttpOnly`.
- **Rationale**: o cookie identifica o aparelho sem depender do frontend; `HttpOnly` evita exposição via JS.
- **Alternatives considered**: id no localStorage (o frontend controla, poderia ser forjado), fingerprint (frágil).

## 3. Nome do aparelho

- **Decision**: derivar do User-Agent (ex.: "Chrome no Android").
- **Rationale**: zero fricção; suficiente para o usuário reconhecer o aparelho na lista (clarify).
- **Alternatives considered**: o usuário nomear (mais um passo).

## 4. Fluxo de login com TOTP

- **Decision**: `POST /auth/login {password, totp?}`. Se o aparelho é conhecido → só a senha; se é novo → exige `totp`. O frontend sabe que é novo via `/auth/status` (`device_registered`).
- **Rationale**: um único endpoint; a senha é pedida uma vez.
- **Alternatives considered**: endpoint separado de "registrar aparelho" com cookie pendente (mais passos/estado).

## 5. Sessão vinculada ao aparelho

- **Decision**: a sessão (cookie assinado) passa a incluir `device_id`; a checagem de auth valida que o aparelho continua registrado.
- **Rationale**: revogar um aparelho (FR-006) precisa invalidar a sessão dele; sem isso, a revogação seria inócua.
- **Alternatives considered**: sessão stateless pura (não permitiria revogação por aparelho).

## 6. Armazenamento de aparelhos

- **Decision**: `backend/.data/devices.json` (gitignorado), como o hash da senha.
- **Rationale**: sem banco de dados; proporcional para poucos aparelhos.
- **Alternatives considered**: DB (fora de escopo).
