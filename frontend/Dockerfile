# syntax=docker/dockerfile:1
# Imagem do proxy + interface (PWA) — ver docs/adr/0005-acesso-por-rede-privada.md.
#
# Estágio 1: build do PWA com a versão do Node fixada em .nvmrc e instalação determinística (npm ci).
# Estágio 2: nginx servindo os estáticos e encaminhando /api para o servidor (mesma regra do proxy de
# desenvolvimento). O TLS não é daqui: é do `tailscale serve`, que fala com este nginx em loopback.
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM nginx:1.27-alpine AS runtime

COPY deploy/nginx/app.conf /etc/nginx/conf.d/default.conf

# O PWA já construído: é este diretório que o nginx serve.
COPY --from=build /app/dist /usr/share/nginx/html

