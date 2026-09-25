# myplanner

App web mobile-first (PWA), de usuário único, para lançar cards no Trello em segundos
pelo celular.

## Visão geral

O app oficial do Trello exige passar por vários campos (cerca de 20 s por card). O
**myplanner** reúne tudo em uma única tela e se integra aos boards do usuário
exclusivamente pela API REST oficial do Trello.

**Critério de sucesso:** abrir o app e salvar um card simples em até 10 segundos, sem
contar o tempo de digitação.

**Fora de escopo nesta versão:** editar/mover/arquivar/listar cards, descrição do card,
banco de dados próprio, IA em tempo de execução, múltiplos usuários, offline e app nativo.

Ver também: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/RULES.md`, `docs/SECURITY.md`,
`docs/TESTS_STRATEGY.md`, `docs/GLOSSARY.md`.

## Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| uv | 0.12.18 (fixada) |
| specify-cli | 1.0.11 (fixada) |
| Python | 3.12 |
| Node (via nvm) | ver `.nvmrc` |
| Git | 2.x |
| GitHub CLI (`gh`) | — |
| Docker | para produção |

## Criação do repositório no GitHub

Repositório **privado**. Dois caminhos:

### Caminho 1 — Interface web

1. Em github.com, clique em **New repository**.
2. Nome: `myplanner`; visibilidade **Private**.
3. **Não** inicialize com README/.gitignore (o repositório já existe localmente).
4. Conecte o remote SSH:

   ```bash
   git remote add origin git@github.com:<OWNER>/myplanner.git
   ```

### Caminho 2 — GitHub CLI

```bash
gh auth login
gh repo create myplanner --private --source . --remote origin --push
```

## Obter API key e token do Trello

1. Acesse o **Trello Admin Portal** e crie um **Power-Up**.
2. No Power-Up, gere a **API key**.
3. Autorize o **token** com escopo **read,write**.
4. Preencha `.env` (a partir de `.env.example`):

   ```bash
   cp .env.example .env
   # TRELLO_API_KEY=...
   # TRELLO_TOKEN=...
   ```

   `.env` nunca é versionado (está em `.gitignore` e `.dockerignore`).

## Ambiente de desenvolvimento

### Backend (Python)

```bash
python -m venv .venv
source .venv/bin/activate
pip install pip-tools
pip-compile requirements.in    # gera requirements.txt (com hashes)
pip-sync requirements.txt
```

### Frontend (Node)

```bash
nvm use     # versão definida em .nvmrc
npm ci      # usa package-lock.json
```

## Fluxo Spec Kit

```
/speckit.specify → /speckit.clarify → /speckit.checklist → /speckit.plan
→ /speckit.tasks → /speckit.analyze → /speckit.implement → /speckit.converge
```

Extensões instaladas: `bug`, `assess` e a extensão local `release` (gancho
`after_implement`, regra A9). Ver `AGENTS.md`.

## Instalação em produção (Docker na VPS Ubuntu 22.04)

### 1. Instalar Docker Engine + plugin Compose (repositório oficial)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2. Criar o usuário de deploy

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
```

### 3. Diretório `/opt/myplanner`

```bash
sudo mkdir -p /opt/myplanner
sudo chown -R deploy:deploy /opt/myplanner
```

### 4. `.env` e certificado HTTPS por IP

- Crie `/opt/myplanner/.env` com os segredos (`TRELLO_*`, `APP_*`, `SESSION_SECRET`, `LLM_*`).
- Certificado Let's Encrypt de IP (perfil shortlived, ~6 dias) com renovação automática.
  A escolha do proxy (Certbot + Nginx ou Caddy) é definida na spec 002.

### 5. Deploy por tag

```bash
git fetch --tags
git checkout v0.1.0    # tag desejada
# (build + restart dos containers)
```

### 6. Rollback

```bash
git checkout v0.0.X    # tag anterior
# (build + restart)
```

## Avisos de segurança (leitura obrigatória)

- **Docker ignora o UFW nas portas publicadas.** Publicar uma porta (`-p`) a torna
  acessível independentemente das regras do UFW. Não exponha portas desnecessariamente.
- **Estar no grupo `docker` equivale a acesso root.**

