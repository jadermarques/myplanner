# Quickstart: descrição do card

**Feature**: `006-descricao-do-card`

## Pré-requisitos

- Features 001–005 implementadas.
- `.env` com `TRELLO_API_KEY`, `TRELLO_TOKEN` e `SESSION_SECRET` (nenhum segredo novo).

## Backend

```bash
cd backend
source .venv/bin/activate
pip-sync requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Frontend

```bash
cd frontend
npm ci
npm run dev -- --host
```

## Validação ponta a ponta

1. Abrir o app autenticado: a tela mostra título, board, prioridade e **Salvar** — **sem**
   campo de descrição ocupando espaço.
2. Tocar em **"adicionar descrição"**: o campo aparece e recebe o foco.
3. Digitar um texto com acentos, emoji e duas linhas → o contador mostra o usado sobre **2.000**.
4. Salvar → `201`; conferir no Trello que o card tem **exatamente** aquele texto, com as quebras.
5. Depois de salvar, o formulário está limpo e a descrição volta **recolhida**.
6. Salvar só com título (sem abrir a descrição) → card criado **sem** descrição; fluxo e tempo
   iguais aos de antes (≤10 s).
7. Digitar mais de 2.000 caracteres → o contador acusa o excesso e o botão **Salvar** fica
   bloqueado; **o texto não é cortado automaticamente**.
8. Simular falha (derrubar o backend) → o texto digitado **permanece** no formulário para a
   nova tentativa.

## Verificação direta da API (sem a interface)

```bash
# com descrição
curl -s -X POST http://127.0.0.1:8000/cards -b jar.txt \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" \
  -d '{"title":"Teste","board_id":"<id>","description":"linha 1\nlinha 2"}'
# acima do limite → 400 com mensagem que cita o limite (nunca o conteúdo)
```
