#!/usr/bin/env bash
# Renovação do certificado do IP — agende no cron do usuário de deploy, duas vezes ao dia (D3).
#
#   crontab -e
#   17 3,15 * * *  /caminho/para/myplanner/deploy/scripts/renew.sh
#
# Renova por webroot (o proxy segue no ar: SEM downtime — research.md D2), recarrega o nginx para
# ele passar a usar o certificado novo e registra tudo em deploy/renew.log.
set -euo pipefail

cd "$(dirname "$0")/.."                 # .../deploy
LOG="renew.log"

{
    echo "--- $(date -Is) renovacao ---"
    docker compose run --rm certbot renew --webroot -w /var/www/certbot --non-interactive
    # O certificado novo só passa a valer depois deste reload (ele é lido no start/reload).
    docker compose exec -T proxy nginx -s reload
    # Estado atual: validade e data da próxima renovação (é assim que se confere o SC-006).
    docker compose run --rm certbot certificates
} >>"${LOG}" 2>&1
