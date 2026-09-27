# syntax=docker/dockerfile:1
# Imagem do proxy + interface (PWA) — ver specs/011-publicacao-em-producao/plan.md.
#
# Estágio 1: build do PWA com a versão do Node fixada em .nvmrc e instalação determinística (npm ci).
# Estágio 2: nginx servindo os estáticos e encaminhando /api para o servidor (mesma regra do proxy de
# desenvolvimento), com duas configurações: bootstrap (sem certificado) e TLS (com certificado).
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM nginx:1.27-alpine AS runtime

# As duas configurações ficam disponíveis; o seletor de modo decide qual entra em vigor.
COPY deploy/nginx/bootstrap.conf /etc/nginx/sites-available/bootstrap.conf
COPY deploy/nginx/tls.conf /etc/nginx/sites-available/tls.conf
COPY deploy/proxy-entrypoint.sh /usr/local/bin/proxy-entrypoint
RUN chmod +x /usr/local/bin/proxy-entrypoint && rm -f /etc/nginx/conf.d/default.conf

# O PWA já construído: é este diretório que o nginx serve.
COPY --from=build /app/dist /usr/share/nginx/html

ENTRYPOINT ["/usr/local/bin/proxy-entrypoint"]
CMD ["nginx", "-g", "daemon off;"]
