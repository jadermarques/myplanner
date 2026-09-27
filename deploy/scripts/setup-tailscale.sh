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

# Este passo instala pacote do sistema: precisa de root. Os scripts de publicação (first-publish/publish)
# rodam como `deploy`; só este não.
if [ "$(id -u)" -ne 0 ]; then
    echo "erro: rode como root (ele instala o pacote do Tailscale):"
    echo "    sudo deploy/scripts/setup-tailscale.sh"
    exit 1
fi

if ! command -v tailscale >/dev/null 2>&1; then
    echo "1/3 instalando o Tailscale"
    # O instalador oficial usa apt. Se o apt estiver quebrado, ele morre com um erro confuso lá dentro —
    # então checamos antes, para dar um diagnóstico útil. Caso real (27/09/2026): o gancho
    # 'command-not-found' não carregava o módulo apt_pkg, devolvia erro e derrubava o instalador.
    if ! apt-get update >/dev/null 2>&1; then
        echo "erro: o 'apt-get update' está falhando nesta máquina, e o instalador do Tailscale depende dele."
        echo "causa comum em imagens com Python fora do padrão: o gancho 'command-not-found' não carrega o"
        echo "módulo apt_pkg, devolve erro e derruba qualquer script com 'set -e'. Conserto (escolha um):"
        echo "    1) apt-get install -y --reinstall python3-apt"
        echo "    2) apt-get -y remove command-not-found      # é só um ajudante cosmético, não faz falta"
        echo "depois rode este script de novo."
        exit 1
    fi
    curl -fsSL https://tailscale.com/install.sh | sh
    if ! command -v tailscale >/dev/null 2>&1; then
        echo "erro: o Tailscale não ficou instalado. Rode 'apt-get update' e veja se ele termina sem erro;"
        echo "se aparecer algo sobre apt_pkg/command-not-found, aplique o conserto mostrado acima."
        exit 1
    fi
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
