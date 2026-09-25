# MyPlanner Constitution

## Core Principles

### I. Spec é o ativo principal

Nenhum código é escrito sem que a spec, o clarify, o plan, as tasks e o analyze da
feature tenham sido concluídos e aprovados. O código é consequência da spec, nunca o
ponto de partida.

**Justificativa**: a spec é a fonte da verdade do *o quê* e do *porquê*; o plan define o
*como*. Escrever código antes desses artefatos gera decisões improvisadas e desconectadas
do rastreio do Spec Kit, violando o papel do agente e a rastreabilidade do produto.

**Verificação**: toda feature possui `specs/NNN-nome/` com `spec.md`, `plan.md` e
`tasks.md` (e `research.md`, `data-model.md`, `contracts/` quando aplicável) antes de
existir código; o `/speckit.analyze` reporta consistência spec ↔ plan ↔ tasks sem pendências
`[NEEDS CLARIFICATION]`.

### II. Specs pequenas e modulares

Cada spec entrega uma única funcionalidade completa e testável de ponta a ponta. Artefatos
por feature vivem em `specs/NNN-nome/`. Documentos globais em `docs/` apenas referenciam
(link), nunca duplicam conteúdo de feature.

**Justificativa**: specs grandes ou que misturam preocupações independentes tornam o
review, o teste e a entrega confusos e atrasam o MVP. Duplicar conteúdo entre `docs/` e
`specs/` cria drift — uma das fontes fica desatualizada.

**Verificação**: nenhuma spec ultrapassa ~5 histórias de usuário nem mistura preocupações
independentes; `docs/` não reproduz conteúdo de feature, apenas referencia por link.

### III. Test-first inegociável

Ciclo Red → Green → Refactor: os testes nascem das tasks, antes do código. Cobertura mínima
de 80% em `domain` e `application`. Toda regra de `docs/RULES.md` tem ao menos um teste que
a referencia pelo código. É proibido alterar, apagar ou "consertar" um teste que falha para
fazê-lo passar; mudar um teste exige aprovação humana e atualização da spec.

**Justificativa**: os testes são o auditor da spec. Alterá-los para "passar" destrói a
garantia de que o código atende aos requisitos e esconde regressões.

**Verificação**: cobertura reportada ≥80% em `domain`/`application`; cada regra do RULES.md
tem teste referenciando seu código (ex.: `R3`); nenhuma alteração de teste sem aprovação
humana registrada.

### IV. Segurança por padrão

Autenticação obrigatória em todos os endpoints, exceto `GET /health`. O token do Trello
existe somente no servidor. Segredos vivem somente em `.env` (nunca versionado, nunca
exibido). Nenhum dado sensível em logs. HTTPS obrigatório, inclusive por IP.

**Justificativa**: o app manipula credenciais do Trello e a sessão do usuário; vazamento de
segredo ou de sessão compromete o produto inteiro. Segurança é requisito, não melhoria.

**Verificação**: endpoints sem autenticação limitam-se a `GET /health`; o token do Trello
não aparece em nenhum artefato de frontend; `.env` ausente do controle de versão
(`.gitignore`/`.dockerignore`) e nenhum segredo em logs, testes ou commits.

### V. Simplicidade e proporcionalidade

Camadas `api → application → domain → infrastructure`; cada camada conhece apenas a de baixo
e o domínio não depende de nada externo. Padrões de projeto (Repository, Strategy, Factory,
etc.) só entram com um ADR que comprove necessidade atual. Gatilhos de reavaliação: chegada
do banco de dados, primeira funcionalidade com IA, mais de um usuário, mais de 3 integrações
externas.

**Justificativa**: introduzir camadas ou padrões "por precaução" aumenta a complexidade sem
benefício e viola YAGNI. Mudanças estruturais devem ser decisões registradas, não improvisos.

**Verificação**: nenhum padrão/camada extra sem ADR correspondente em `docs/adr/`; cada
gatilho de reavaliação dispara a abertura de ADR antes de especificar.

### VI. Mobile-first e velocidade

Salvar um card em até 10 segundos (sem contar a digitação) no celular. Uma tela por tarefa.
Mensagens claras de sucesso e erro. Dados digitados nunca se perdem em caso de erro.

**Justificativa**: o critério de sucesso principal do produto é a velocidade de lançar um
card pelo celular; atrito de UI ou perda de dados digitados quebra esse objetivo.

**Verificação**: E2E (Playwright em viewport de celular) mede o fluxo de criação em ≤10 s;
erros mantêm os campos preenchidos e exibem mensagem acionável.

### VII. Independência de fornecedor

Agnóstico de modelo de IA e de ferramenta de agente. A configuração de IA é feita apenas por
variáveis de ambiente (`LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`), e trocar
de modelo não exige mudança de código.

**Justificativa**: evitar dependência de um fornecedor específico preserva a portabilidade do
produto e dos fluxos de agente; config por ambiente é reversível e não versiona segredos.

**Verificação**: nenhum identificador de modelo/provedor hardcoded no código; a troca de
modelo passa exclusivamente por variáveis de ambiente (porta `LlmProvider`).

### VIII. Rastreabilidade e versionamento

Versionamento SemVer com a versão única no arquivo `VERSION`, exibida na UI. Após todo
`/speckit.implement`: commit local + tag anotada; push somente com confirmação explícita; em
caso de dúvida sobre o incremento, perguntar ao usuário. Enquanto o MVP não estiver completo,
a versão fica em `0.x.y`.

**Justificativa**: commit + tag + versão rastreável permitem restaurar qualquer estado e
identificar a versão em execução (rodapé da UI). Push controlado evita publicar sem revisão.

**Verificação**: `VERSION` e a UI exibem a mesma versão; cada implement gera commit com a
mensagem canônica e tag `vX.Y.Z`; nenhum push sem "Sim" explícito.

### IX. Limites da IA

Não tocar produção (`/opt/myplanner`); não chamar serviços externos (incluindo a API do
Trello) nem instalar pacotes globais sem aprovação; não ler ou editar arquivos protegidos
(`.env`, `*.pem`, `credentials*`, certificados); nunca exibir segredos.

**Justificativa**: operações de produção e chamadas externas têm efeitos irreversíveis e
devem permanecer sob controle humano. Arquivos protegidos concentram credenciais.

**Verificação**: nenhuma escrita/leitura em `/opt` ou em arquivos protegidos durante o
trabalho do agente; serviços externos e pacotes globais só após aprovação explícita.

### X. Idioma

Specs, constituição, plans, tasks, documentos em `docs/`, `README.md` e todos os textos de
tela em Português do Brasil. Código-fonte (identificadores, comentários, nomes de testes) e
mensagens de commit em inglês.

**Justificativa**: separar o idioma do produto/negócio (pt-BR) do idioma do código (inglês)
mantém a documentação acessível ao usuário e o código idiomático para a comunidade e
ferramentas.

**Verificação**: artefatos e UI sem inglês; código e commits sem pt-BR.

## Governance

A constituição é a norma máxima do projeto e prevalece sobre qualquer outra prática. Emendas
seguem este processo:

1. **Proposta**: registrar a mudança desejada com justificativa (por quê) e a forma de
   verificação da regra nova/alterada.
2. **Impacto**: identificar quais specs, plans e regras de `docs/RULES.md` existentes são
   afetados e qual migração será necessária.
3. **Aprovação**: a emenda exige aprovação humana explícita (nunca é auto-aplicada).
4. **Versionamento**: incrementar a versão da constituição (SemVer) — `major` para mudança
   de princípio inegociável, `minor` para nova regra, `patch` para esclarecimento — e
   atualizar `Ratified`/`Last Amended` na linha de versão.
5. **Registro**: documentar a emenda e seu impacto (ex.: mensagem de commit
   `docs: amend constitution to vX.Y.Z (<resumo>)`).

Nenhuma spec, plan ou task pode contradizer a constituição. Em caso de conflito, a
constituição prevalece até que uma emenda aprovada a altere.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
