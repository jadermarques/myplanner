# Quickstart: Mais de uma etiqueta por card

**Feature**: `010-multiplas-etiquetas` | **Date**: 2026-09-27

## Como validar em 2 minutos

1. Backend: `cd backend && ../.venv/bin/pytest -q` → **verde**.
2. Frontend (unidade + build): `cd frontend && npm test -- --run && npm run build` → **verde**.
3. E2E: `cd frontend && npx playwright test` → **verde**.
4. No celular (`http://<IP-DA-MÁQUINA>:5173`, backend `:8000` com `--reload`):
   - toque em duas etiquetas → as duas ficam marcadas e as outras não mudam;
   - toque de novo em uma → só ela desmarca;
   - toque em **"limpar"** → todas desmarcam de uma vez;
   - salve com duas marcadas → **confira no Trello se o card saiu com as duas**;
   - salve sem nenhuma → card **sem etiqueta** (comportamento de antes desta feature).

## Sinais de que está certo

- Cada etiqueta custa **1 toque**; marcar duas nunca desmarca a primeira.
- Nenhum card deixa de ser criado por causa de etiqueta: nome inexistente é ignorado e os válidos valem.
- A prioridade continua sendo **uma só** (R3) e a lista de destino continua sendo validada contra o board (R8).
- O rótulo da seção continua "Etiqueta" e as caixas de seleção são alcançáveis por leitor de tela.

## Se algo parecer estranho

- Etiqueta não aparece no card: verifique se ela **existe no board** (a criação só aplica as existentes) e se
  a tela foi recarregada após o deploy (PWA em cache) — o campo antigo `label` continua aceito por uma versão.
- Item "Etiqueta" invisível: a leitura de etiquetas falhou; por projeto, o campo some e a captura continua.
