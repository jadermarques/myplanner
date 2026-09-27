#!/usr/bin/env bash
# PRIMEIRA publicação (uma vez por servidor) — ver specs/011-publicacao-em-producao/quickstart.md.
#
# Faz quatro coisas, na ordem:
#   1. sobe o servidor e o proxy em modo bootstrap (só o desafio ACME na porta 80);
#   2. emite o certificado do IP por HTTP-01/webroot (RFC 8738 permite IP neste desafio);
#   3. reinicia o proxy: agora ele encontra o certificado e sobe em modo TLS;
#   4. verifica a saúde do servidor.
#
# Depois disso, publicar versões novas é só deploy/scripts/publish.sh <tag>.
set -euo pipefail

cd "$(dirname "$0")/.."                 # .../deploy
if [ ! -f .env ]; then
    echo "erro: crie deploy/.env a partir de deploy/.env.example (os segredos ficam só no servidor)"
    exit 1
fi
# shellcheck disable=SC1091
set -a; . ./.env; set +a
: "${PUBLIC_HOST:?defina PUBLIC_HOST em deploy/.env (o IP publico do servidor)}"
PROFILE="${CERTBOT_PROFILE:-shortlived}"

issue() {
    docker compose run --rm certbot certonly \
        --webroot -w /var/www/certbot \
        --preferred-challenges http \
        -d "${PUBLIC_HOST}" \
        --non-interactive --agree-tos --register-unsafely-without-email "$@"
}

echo "1/4 subindo servidor e proxy em modo bootstrap"
docker compose up -d --build backend proxy

echo "2/4 emitindo o certificado de ${PUBLIC_HOST} (perfil ${PROFILE})"
if ! issue --preferred-profile "${PROFILE}"; then
    echo "aviso: perfil ${PROFILE} indisponivel para esta conta; emitindo com o perfil padrao"
    issue
fi

echo "3/4 reiniciando o proxy em modo TLS"
docker compose restart proxy
sleep 3

echo "4/4 verificando"
docker compose ps
echo
echo "pronto: abra https://${PUBLIC_HOST}/ no celular (com o https escrito) e defina a senha"
echo "no primeiro acesso. Para conferir o certificado: docker compose run --rm certbot certificates"
