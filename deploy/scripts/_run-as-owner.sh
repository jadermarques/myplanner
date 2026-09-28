#!/usr/bin/env bash
# Garante que o script de deploy rode como o DONO do repositório.
#
# Por quê: a chave SSH do GitHub, o acesso ao Docker e o `deploy/.env` vivem no usuário `deploy`
# (dono de /opt/myplanner — ver README, passos 2 e 3). Rodar como outro usuário (tipicamente `root`)
# quebra o deploy com dois erros confusos e em sequência:
#   - "fatal: detected dubious ownership in repository at '/opt/myplanner'"
#   - "git@github.com: Permission denied (publickey)"
# Aconteceu de verdade em 27/09/2026, publicando a v0.15.1. Este guard existe para não repetir.
#
# Uso — NÃO execute este arquivo direto. Faça, no topo do script de deploy:
#     source "$(dirname "${BASH_SOURCE[0]}")/_run-as-owner.sh"
#
# Comportamento: se quem chamou não é o dono, o script se reexecuta como o dono (via sudo; sendo root,
# o sudo é sem senha). Se não for possível, explica o comando exato e para — sem erro críptico do git.

_rao_self="${BASH_SOURCE[1]}"
_rao_script="$(cd "$(dirname "${_rao_self}")" && pwd)/$(basename "${_rao_self}")"
_rao_repo="$(cd "$(dirname "${_rao_script}")/../.." && pwd)"
_rao_owner="$(stat -c '%U' "${_rao_repo}" 2>/dev/null || stat -f '%Su' "${_rao_repo}" 2>/dev/null || true)"

if [ -n "${_rao_owner}" ] && [ "$(id -un)" != "${_rao_owner}" ]; then
    if [ "$(id -u)" -eq 0 ] && command -v sudo >/dev/null 2>&1; then
        echo "== o repositório pertence a '${_rao_owner}'; reexecutando o deploy como '${_rao_owner}' =="
        exec sudo -u "${_rao_owner}" -H bash "${_rao_script}" "$@"
    fi
    echo "erro: o repositório (${_rao_repo}) pertence ao usuário '${_rao_owner}'."
    echo "      rode o deploy como esse usuário:"
    echo "          sudo -u ${_rao_owner} -H bash ${_rao_script} ${1:-<tag>}"
    exit 1
fi
