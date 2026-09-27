#!/usr/bin/env bash
# Publica uma tag versionada (e também serve para reverter) — ver specs/011-publicacao-em-producao/quickstart.md.
#
#   deploy/scripts/publish.sh v0.12.0     # publicar uma versão
#   deploy/scripts/publish.sh v0.11.0     # reverter para a anterior (mesmo comando, tag anterior)
#
# Segredos ficam em deploy/.env, no servidor: este script não cria, não lê em voz alta e não
# imprime nenhum valor (S8). Os volumes (senha e certificado) não são tocados.
set -euo pipefail

TAG="${1:?uso: deploy/scripts/publish.sh <tag> (ex.: v0.12.0)}"

cd "$(dirname "$0")/.."                 # .../deploy
if [ ! -f .env ]; then
    echo "erro: crie deploy/.env a partir de deploy/.env.example (os segredos ficam só no servidor)"
    exit 1
fi
# shellcheck disable=SC1091
set -a; . ./.env; set +a
: "${PUBLIC_HOST:?defina PUBLIC_HOST em deploy/.env (o IP publico do servidor)}"

echo "== publicando ${TAG} =="
cd ..
git fetch --tags
git checkout "${TAG}"

cd deploy
docker compose up -d --build
docker compose ps

echo
echo "pronto: https://${PUBLIC_HOST}/"
echo "confira no rodape do app a versao ${TAG} e o GET /health respondendo:"
curl -fsS "https://${PUBLIC_HOST}/api/health" && echo
