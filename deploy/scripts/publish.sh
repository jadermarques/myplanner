#!/usr/bin/env bash
# Publica uma tag versionada (e também serve para reverter) — ver specs/011-publicacao-em-producao/quickstart.md.
#
#   deploy/scripts/publish.sh v0.13.0     # publicar uma versão
#   deploy/scripts/publish.sh v0.12.0     # reverter para a anterior (mesmo comando, tag anterior)
#
# Segredos ficam em deploy/.env, no servidor: este script não cria, não lê em voz alta e não imprime
# nenhum valor (S8). O volume do app (hash da senha) não é tocado.
set -euo pipefail

# Roda como o dono do repositório (chave SSH do GitHub, Docker e deploy/.env vivem nele). Se você
# chamar como outro usuário (ex.: root), o script se reexecuta como o dono — ver _run-as-owner.sh.
source "$(dirname "${BASH_SOURCE[0]}")/_run-as-owner.sh"

TAG="${1:?uso: deploy/scripts/publish.sh <tag> (ex.: v0.13.0)}"

cd "$(dirname "$0")/.."                 # .../deploy
if [ ! -f .env ]; then
    echo "erro: crie deploy/.env a partir de deploy/.env.example (os segredos ficam só no servidor)"
    exit 1
fi

echo "== publicando ${TAG} =="
cd ..
git fetch --tags
git checkout "${TAG}"

cd deploy
docker compose up -d --build backend proxy
docker compose ps

echo
echo "conferindo de dentro da máquina:"
curl -fsS -o /dev/null -w '    /api/health -> %{http_code}\n' http://127.0.0.1/api/health
echo
echo "no celular (com o app do Tailscale conectado): abra o endereço de 'tailscale serve status'"
echo "confira no rodapé do app a versão ${TAG}"

