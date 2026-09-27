#!/bin/sh
# Seletor de modo do proxy (ver specs/011-publicacao-em-producao/research.md, D2/D3):
#   sem certificado → modo bootstrap (só o desafio ACME em 80; nada de app em HTTP)
#   com certificado → modo TLS (443 com o certificado do IP; 80 só desafio + redirecionamento)
#
# A substituição é feita com sed (só o marcador ${PUBLIC_HOST}) para não mexer nas variáveis
# próprias do nginx ($host, $uri, $request_uri...).
set -eu

PUBLIC_HOST="${PUBLIC_HOST:?defina PUBLIC_HOST (o IP publico do servidor)}"
CERT_DIR="/etc/letsencrypt/live/${PUBLIC_HOST}"

mkdir -p /var/www/certbot /etc/nginx/conf.d

if [ -s "${CERT_DIR}/fullchain.pem" ] && [ -s "${CERT_DIR}/privkey.pem" ]; then
    echo "[proxy] certificado de ${PUBLIC_HOST} encontrado: subindo em modo TLS"
    sed "s|\${PUBLIC_HOST}|${PUBLIC_HOST}|g" /etc/nginx/sites-available/tls.conf \
        > /etc/nginx/conf.d/default.conf
else
    echo "[proxy] sem certificado para ${PUBLIC_HOST}: modo bootstrap (apenas o desafio ACME)"
    cp /etc/nginx/sites-available/bootstrap.conf /etc/nginx/conf.d/default.conf
fi

exec "$@"
