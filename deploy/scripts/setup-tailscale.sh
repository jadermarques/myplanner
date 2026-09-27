#!/usr/bin/env bash
# Instala e conecta o Tailscale nesta máquina (uma vez por servidor).
# Ver docs/adr/0005-acesso-por-rede-privada.md e specs/011-publicacao-em-producao/quickstart.md.
#
#   1. instala o Tailscale (se ainda não estiver instalado);
#   2. conecta o servidor ao seu tailnet (vai imprimir um link para abrir no navegador);
#   3. publica o app para os aparelhos do tailnet, em HTTPS, via `tailscale serve`;
#   4. mostra o endereço final.
#
# Nada aqui abre porta para a internet: o `tailscale serve` escuta dentro da rede privada.
set -euo pipefail

cd "$(dirname "$0")/.."                       # .../deploy
if [ ! -f .env ]; then
    echo "erro: crie deploy/.env a partir de deploy/.env.example (os segredos ficam só no servidor)"
    exit 1
fi

if ! command -v tailscale >/dev/null 2>&1; then
    echo "1/3 instalando o Tailscale"
    curl -fsSL https://tailscale.com/install.sh | sh
else
    echo "1/3 Tailscale já instalado: $(tailscale version | head -1)"
fi

echo "2/3 conectando ao tailnet (se aparecer um link, abra no navegador e autorize este servidor)"
if tailscale status >/dev/null 2>&1; then
    echo "    já conectado"
else
    tailscale up
fi

echo "3/3 publicando o app para os aparelhos do tailnet"
tailscale serve --bg --https=443 http://127.0.0.1:80

DNS_NAME="$(tailscale status --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))' 2>/dev/null || true)"
echo
echo "pronto. Abra no celular (com o app do Tailscale conectado):"
if [ -n "${DNS_NAME}" ]; then
    echo "    https://${DNS_NAME}/"
else
    echo "    https://<nome-do-no>.<seu-tailnet>.ts.net/    (veja em: tailscale serve status)"
fi
echo
echo "Dois ajustes no console do Tailscale (login.tailscale.com), se ainda não fez:"
echo "  - DNS: habilite 'HTTPS Certificates' (é o que dá o certificado válido, sem aviso de segurança);"
echo "  - Máquinas: no nó deste servidor, desative 'Key expiry' para ele não sair da rede sozinho."
