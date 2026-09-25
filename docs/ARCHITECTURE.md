# Arquitetura — myplanner

## Topologia

```
Celular → PWA (React) → BFF (Python/FastAPI) → API REST do Trello
```

- O frontend nunca chama o Trello diretamente.
- O token do Trello existe somente no servidor.

## Backend

- Python 3.12, FastAPI, cliente HTTP assíncrono, configuração tipada.
- Camadas (cada uma conhece apenas a de baixo; o domínio não depende de nada externo):

```
api (apresentação) → application (casos de uso) → domain (regras)
                       └─────────────┬───────────┘
                                     ↓
                        infrastructure (cliente Trello, provedor de IA, config)
```

## Frontend

- React + TypeScript + Vite, PWA instalável, mobile-first, alvos de toque grandes,
  poucas bibliotecas.

## Preparação para IA (sem uso agora)

- Porta `LlmProvider` no domínio/aplicação e um adaptador compatível com a API OpenAI,
  configurado por `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`.
- Trocar de modelo não pode exigir mudança de código.

## Regra de Proporcionalidade

- POO com encapsulamento e padrões (Repository, Strategy, Factory, Observer, Singleton
  etc.) só entram quando resolvem um problema concreto e existente, registrado em ADR.
- Proibido introduzir padrão ou camada "por precaução".

## Gatilhos obrigatórios de reavaliação (abrir ADR antes de especificar)

- Chegada do banco de dados.
- Primeira funcionalidade com IA.
- Mais de um usuário.
- Mais de 3 integrações externas.

## Decisões (ADRs)

- Decisões específicas por feature ficam em `docs/adr/NNNN-titulo.md` (contexto, opções,
  trade-offs). Criadas por feature, nunca antecipadas.
