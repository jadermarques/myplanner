#!/usr/bin/env bash
# PRIMEIRA publicação (uma vez por servidor) — ver specs/011-publicacao-em-producao/quickstart.md.
#
# Com a rede privada (ADR 0005), publicar deixou de ter "dois atos": não há mais certificado para emitir.
#   1. sobe servidor e proxy (o proxy escuta só no loopback: nada exposto à internet);
#   2. verifica de dentro da máquina que o app responde;
#   3. publica o app no tailnet (o Tailscale cuida do HTTPS e do certificado).
set -euo pipefail

# Roda como o dono do repositório (chave SSH do GitHub, Docker e deploy/.env vivem nele). Se você
# chamar como outro usuário (ex.: root), o script se reexecuta como o dono — ver _run-as-owner.sh.
source "$(dirname "${BASH_SOURCE[0]}")/_run-as-owner.sh"

cd "$(dirname "$0")/.."                       # .../deploy
if [ ! -f .env ]; then
    echo "erro: crie deploy/.env a partir de deploy/.env.example (os segredos ficam só no servidor)"
    exit 1
fi

if ! command -v tailscale >/dev/null 2>&1; then
    echo "erro: o Tailscale não está instalado nesta máquina."
    echo "rode primeiro: deploy/scripts/setup-tailscale.sh"
    exit 1
fi

echo "1/3 subindo servidor e proxy (proxy só no loopback: 127.0.0.1:80)"
docker compose up -d --build backend proxy

echo "2/3 verificando de dentro da máquina"
APP_OK=""
for _ in $(seq 1 20); do
    if curl -fsS -o /dev/null http://127.0.0.1/api/health; then
        APP_OK=1
        echo "    /api/health respondeu 200"
        break
    fi
    sleep 1
done
if [ -z "${APP_OK}" ]; then
    echo "    aviso: o app ainda não respondeu em http://127.0.0.1/api/health"
    echo "    veja o que aconteceu: docker compose logs --tail=50 backend proxy"
fi

echo "3/3 publicando no tailnet (HTTPS e certificado gerenciados pelo Tailscale)"
tailscale serve --bg --https=443 http://127.0.0.1:80

DNS_NAME="$(tailscale status --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))' 2>/dev/null || true)"
echo
docker compose ps
echo
if [ -n "${DNS_NAME}" ]; then
    echo "pronto: abra https://${DNS_NAME}/ no celular (com o app do Tailscale conectado)"
    echo "e defina a senha no primeiro acesso. O rodapé deve mostrar a versão da tag publicada."
else
    echo "pronto: veja o endereço com 'tailscale serve status' e abra no celular"
fi

