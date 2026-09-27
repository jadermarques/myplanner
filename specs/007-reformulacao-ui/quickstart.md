# Quickstart: reformulação da interface

**Feature**: `007-reformulacao-ui`

## Pré-requisitos

- Features 001–006 implementadas.
- Frontend e backend no ar (`npm run dev -- --host` + `uvicorn app.main:app --port 8000`).

## Validação visual (celular)

1. Abrir o app autenticado **sem tocar em nada** e digitar diretamente: o texto entra no título
   (cursor já posicionado).
2. Tocar **uma vez** numa prioridade: ela fica marcada; o board atual continua visível no topo.
3. Tocar no **chip do board**: escolher outro em um toque; recarregar e confirmar que foi lembrado.
4. Tocar em **"adicionar descrição"**, escrever um texto com várias linhas: a **barra de salvar
   continua visível** e alcançável (nada é empurrado para fora).
5. **Salvar**: confirmação evidente ("Card criado!"), campos limpos e **cursor de volta no título**
   para o próximo card.
6. Abrir o menu **"⋯"**: encontrar *Trocar senha*, *Sair* e a versão — sem disputar espaço com o
   formulário.
7. Girar/estreitar: simular **320 × 568** (DevTools) e conferir que nada é cortado e que a barra de
   ação continua alcançável.
8. Ativar o modo avião: a faixa de "sem conexão" aparece **empurrando** o conteúdo (sem sobrepor).

## Verificação automatizada

```bash
cd frontend
npm test            # unidade: prioridade (novo controle), CardForm, telas de auth
npx playwright test # E2E: captura, descrição, autenticação + ui.spec.ts (ergonomia)
npm run build       # type-check + PWA
```

Checks de ergonomia cobertos pelo `tests/e2e/ui.spec.ts`:

- campo de título já focado ao abrir (0 toques preparatórios);
- prioridade selecionada em **1 toque**;
- alvos de toque ≥48 px nos controles principais;
- viewport **320 × 568** sem corte, com a ação primária visível.
