# Data Model: Autenticação somente por senha

**Feature**: `005-senha-unica` | **Date**: 2026-09-26

Sem banco de dados. Único estado persistido: o hash da senha em
`backend/.data/password_hash` (gitignorado).

## Entidades (depois desta feature)

### Senha do usuário único

- **Descrição**: única credencial de acesso ao app.
- **Atributos**: hash Argon2id (nunca a senha em texto plano).
- **Regras**: definida apenas quando nenhuma existe; a troca exige a senha atual.

### Sessão

- **Descrição**: cookie assinado que comprova o acesso.
- **Atributos**: indicador de autenticação. A expiração não é um campo do payload: é imposta
  pelo prazo de assinatura de 90 dias, renovado a cada uso.
- **Regras**: válida pela assinatura e pelo prazo; **não** é mais vinculada a um dispositivo.

## Entidades removidas nesta feature

- **Dispositivo** (`backend/.data/devices.json`) — removida.
- **Segredo de autenticador (TOTP)** — removida; a configuração que o guardava sai do `.env`.

## Transições de estado

- `sem senha` → (definir senha) → `autenticado`.
- `autenticado` → (usar) → sessão renovada por 90 dias.
- `autenticado` → (sair) → `sem sessão`.
- *(removida)* `dispositivo novo` → (senha + código) → `registrado`.
