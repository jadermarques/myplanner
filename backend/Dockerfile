# syntax=docker/dockerfile:1
# Imagem do servidor (FastAPI) — ver specs/011-publicacao-em-producao/plan.md.
#
# O layout do repositório é preservado de propósito: backend/app/config.py deriva a raiz do projeto
# a partir da localização do arquivo (parents[2]) e lê VERSION e .env a partir dela. Aqui os segredos
# chegam por variáveis de ambiente (têm precedência sobre .env), então NÃO existe .env na imagem.
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependências fixadas com hashes (pip-tools) e nada de toolchain de build na imagem final.
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --require-hashes -r /app/backend/requirements.txt

# VERSION entra na imagem: o rodapé do app e GET /version leem esse arquivo (FR-009).
COPY VERSION /app/VERSION
COPY backend/app /app/backend/app

# Diretório do hash de senha (volume persistente em produção) sob o usuário da aplicação,
# para que o volume nomeado nasça com o dono certo.
RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /app/backend/.data \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Um processo, sem --reload. Os cabeçalhos de proxy são aceitos porque a porta 8000 nunca é publicada:
# quem fala com este serviço é só o proxy, na rede interna do compose.
CMD ["uvicorn", "app.main:app", "--app-dir", "/app/backend", "--host", "0.0.0.0", "--port", "8000", \
     "--proxy-headers", "--forwarded-allow-ips", "*"]
