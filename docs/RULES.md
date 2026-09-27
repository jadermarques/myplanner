# RULES — invariantes do myplanner

Invariantes numeradas. Toda regra precisa de ao menos um teste que a referencie pelo
código (ex.: `R3`). Ver `docs/TESTS_STRATEGY.md`.

## R — Domínio

- **R1**: Um card é criado exclusivamente via API REST oficial do Trello; o frontend
  nunca chama o Trello diretamente.
- **R2**: O token do Trello existe somente no servidor (nunca no cliente).
- **R3**: As prioridades de um card limitam-se aos labels configurados em
  `trello.priority_labels` (Muito alta, Alta, Média, Baixa, Muito baixa).
- **R4**: ~~Nesta versão não há campo descrição no card (fora de escopo).~~ **REVOGADA** pela
  feature `006-descricao-do-card` (2026-09-26) — substituída pela R6.
- **R5**: O card é criado em um board selecionado; o board padrão é `last_used`
  (config `ui.default_board`).
- **R6**: A descrição do card é **opcional**, limitada a **2.000 caracteres**, existe apenas na
  criação (não há edição) e é enviada ao Trello exatamente como digitada — sem formatação
  interpretada e sem alterar quebras de linha.
- **R7**: A etiqueta do card é **opcional** e só é aplicada se **existir no board** no momento da
  criação; se tiver desaparecido, o card é criado sem ela (nunca falha por causa disso). As
  etiquetas usadas como prioridade **não** são oferecidas de novo (ver R3) e etiquetas **sem nome**
  não são oferecidas.
- **R8**: A lista de destino do card é **opcional** e o padrão é sempre a **primeira lista aberta** do
  board. Uma lista informada só é usada se **pertencer ao board**; caso contrário (lista de outro
  board, apagada ou vazia) o card vai para a primeira lista — **nunca** para fora do board e
  **nunca** com erro.

## S — Segurança

- **S1**: Autenticação obrigatória em todos os endpoints, exceto `GET /health`.
- **S2**: A senha do usuário único é armazenada como hash Argon2id.
- **S3**: Sessão de 90 dias renovada a cada uso, em cookie `HttpOnly`, `Secure` e
  `SameSite=Strict`.
- **S4**: ~~TOTP (app autenticador) é exigido apenas ao registrar um novo aparelho.~~
  **REVOGADA** pelo ADR 0004 (2026-09-26) — não há segundo fator; o acesso é somente por senha.
- **S5**: ~~Bloqueio progressivo após tentativas de login falhas.~~
  **REVOGADA** pelo ADR 0004 (2026-09-26) — cada tentativa é avaliada de forma independente.
- **S6**: Proteção CSRF e cabeçalhos de segurança (CSP, HSTS) em todas as respostas.
- **S7**: HTTPS obrigatório (certificado de IP shortlived com renovação automática).
- **S8**: Logs nunca registram senha, token, segredo, cookie ou dados pessoais
  (e-mail, telefone, CPF) em texto plano.
- **S9**: Segredos existem somente em `.env` (nunca versionado).

## P — Performance

- **P1**: Abrir o app e salvar um card simples em até 10 s, sem contar a digitação.
- **P2**: Orçamento de rate limit do Trello abaixo de 100 req/10 s por token, com
  backoff exponencial em HTTP 429.

## O — Operação

- **O1**: Python em `.venv` com `requirements.in → requirements.txt` (hashes, pip-tools).
- **O2**: Node com versão fixada em `.nvmrc` e `package-lock.json`, instalado via `npm ci`.
- **O3**: Produção em Docker.
- **O4**: A versão única vive em `VERSION` (SemVer `0.x.y` até o MVP completo).
- **O5**: `pre-commit` com gitleaks (detecção de segredos) obrigatório.
- **O6**: Deploy em produção por tag; rollback documentado no `README.md`.
