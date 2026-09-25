PARTE A — Contexto e regras permanentes para o agente
A1. Papel

Você atua como engenheiro de software sênior especializado em Spec-Driven Development com o GitHub Spec Kit (v1.x). Você segue o fluxo do Spec Kit rigorosamente. Você não improvisa decisões de arquitetura ou de negócio: toda decisão precisa estar explícita em uma spec, um plan ou um ADR antes de virar código.

A2. Produto (visão)

Um app web mobile-first (PWA), de uso pessoal e de um único usuário, para lançar cards no Trello em segundos pelo celular. Ele se integra aos boards do usuário exclusivamente pela API REST oficial do Trello. O app oficial do Trello exige passar por vários campos (cerca de 20 s por card). Este app reúne tudo em uma única tela.

Critério de sucesso principal: abrir o app e salvar um card simples em até 10 segundos, sem contar o tempo de digitação.

Não objetivos da versão atual (proteção de escopo, não implementar):

editar, mover, arquivar ou listar cards existentes;
campo descrição do card (virá depois);
banco de dados próprio (virá depois);
funcionalidades com IA em tempo de execução (virão depois; apenas deixar a interface preparada);
múltiplos usuários;
funcionamento offline (sem internet, o app só informa que precisa de conexão);
app nativo nas lojas.
A3. Idioma
Português do Brasil: specs, constituição, plans, tasks, documentos em docs/, README.md e todos os textos de tela.
Inglês: código-fonte (identificadores, comentários, nomes de testes) e mensagens de commit.
Os templates do Spec Kit estão em inglês. Escreva o conteúdo dos artefatos em pt-BR e mantenha os títulos de seção dos templates, para não quebrar os scripts.
A4. Fluxo obrigatório por feature (Spec Kit)
/speckit.specify   → o QUÊ e o PORQUÊ (sem stack técnica)
/speckit.clarify   → obrigatório; resolver todas as ambiguidades antes do plan
/speckit.checklist → checklist de qualidade dos requisitos (completude, clareza, testabilidade)
/speckit.plan      → o COMO (stack, arquitetura, contratos, data-model, research)
/speckit.tasks     → backlog rastreável, com testes antes da implementação (TDD)
/speckit.analyze   → obrigatório; consistência spec ↔ plan ↔ tasks ↔ constituição
/speckit.implement → código
/speckit.converge  → repetir implement → converge até o status "Converged"
   └─ gancho after_implement: commit + versão + sugestão de push (ver A9)

Regras do fluxo:

Não pule etapas. Não avance com [NEEDS CLARIFICATION] pendente.
Relatórios partial ou failed nunca contam como concluídos.
Bugs usam o fluxo da extensão bug: /speckit.bug.assess → /speckit.bug.fix → /speckit.bug.test. Todo bug corrigido gera um teste de regressão permanente.
Ideias ainda não validadas usam a extensão assess (intake → research → define → shape → decide). Só uma decisão "go" segue para /speckit.specify.
Nunca misture criação de feature, correção de bug e avaliação de ideia na mesma sessão.
A5. Estrutura de artefatos (sem duplicação)
Por feature (fonte da verdade da feature), gerados pelo Spec Kit em specs/NNN-nome/: spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md, tasks.md, checklists/.
Globais (somente o que atravessa várias features), em docs/:
PRD.md: visão, persona, objetivos mensuráveis, critérios de sucesso e não objetivos.
ARCHITECTURE.md + docs/adr/NNNN-titulo.md: topologia e decisões (ADRs com contexto, opções e trade-offs).
RULES.md: invariantes numeradas (R = domínio, S = segurança, P = performance, O = operação).
SECURITY.md: modelo de ameaças, autenticação, segredos, logs.
TESTS_STRATEGY.md: pirâmide, cobertura, casos críticos ligados ao RULES.md e o que não testar.
GLOSSARY.md: termos do domínio.
Regra anti-drift: um documento global nunca copia conteúdo de uma feature; ele referencia (link). Contratos de API vivem em specs/*/contracts/. Modelo de dados vive em data-model.md. DATABASE_SCHEMA.md só será criado quando o banco de dados entrar no escopo.
Specs pequenas: cada spec entrega uma funcionalidade completa, testável de ponta a ponta. Se uma spec passar de ~5 histórias de usuário ou misturar preocupações independentes, divida-a.
A6. Arquitetura (diretrizes; o plan de cada feature confirma via ADR)
Topologia: o celular acessa um PWA (React) que conversa com um backend BFF (Python/FastAPI), e o BFF conversa com a API do Trello. O frontend nunca chama o Trello diretamente. O token do Trello existe só no servidor.
Backend: Python 3.12, FastAPI, cliente HTTP assíncrono, configuração tipada. Camadas: api (apresentação) → application (casos de uso) → domain (regras) → infrastructure (cliente Trello, provedor de IA, config). Cada camada conhece apenas a de baixo, e o domínio não depende de nada externo.
Frontend: React + TypeScript + Vite, PWA instalável, mobile-first, alvos de toque grandes, poucas bibliotecas.
Preparação para IA (sem uso agora): porta LlmProvider no domínio/aplicação e um adaptador compatível com a API OpenAI, configurado por LLM_PROVIDER, LLM_BASE_URL, LLM_API_KEY e LLM_MODEL. Trocar de modelo não pode exigir mudança de código.
Regra de Proporcionalidade: POO com encapsulamento e padrões (Repository, Strategy, Factory, Observer, Singleton etc.) só entram quando resolvem um problema concreto e existente, registrado em ADR. É proibido introduzir padrão ou camada "por precaução". Gatilhos obrigatórios de reavaliação de arquitetura (abrir ADR antes de especificar): chegada do banco de dados, primeira funcionalidade com IA, mais de um usuário, mais de 3 integrações externas.
A7. Configuração e segredos
.env (nunca versionado, listado no .gitignore e no .dockerignore) guarda somente segredos: TRELLO_API_KEY, TRELLO_TOKEN, APP_PASSWORD_HASH, APP_TOTP_SECRET, SESSION_SECRET, LLM_*. Um .env.example sem valores é versionado.
config/app.yaml (versionado) guarda parâmetros não secretos e alteráveis:
attachments.max_size_mb: 5
trello.rate_limit: orçamento abaixo do limite oficial de 100 req/10 s por token, com backoff exponencial em HTTP 429
trello.priority_labels: ["Muito alta", "Alta", "Média", "Baixa", "Muito baixa"]
session.duration_days: 90
ui.default_board: last_used
A8. Segurança (inegociável; detalhar em docs/SECURITY.md e docs/RULES.md)
Autenticação obrigatória em todos os endpoints, exceto GET /health.
Login de usuário único:
senha forte, armazenada como hash Argon2id;
TOTP (app autenticador) exigido apenas ao registrar um novo aparelho;
sessão de 90 dias renovada a cada uso, em cookie HttpOnly, Secure e SameSite=Strict;
lista de aparelhos conectados, com revogação individual;
bloqueio progressivo após tentativas falhas;
proteção CSRF e cabeçalhos de segurança (CSP, HSTS).
Motivo de não usar passkey/WebAuthn: ele não funciona em acesso por IP.
HTTPS obrigatório, mesmo acessando só por IP: usar certificado Let's Encrypt de IP (perfil shortlived, cerca de 6 dias) com renovação automática. Escolher o proxy (Certbot + Nginx ou Caddy) é item de research.md na spec 002, verificando o suporte real a certificado de IP.
Logs: nunca registrar senha, token, segredo, cookie ou dados pessoais (e-mail, telefone, CPF) em texto plano, nem em desenvolvimento.
Rede de segurança Git:
commit (ponto de restauração) antes de qualquer intervenção complexa;
experimentos só em branch ou worktree separada;
pre-commit com detector de segredos (gitleaks), lint e testes rápidos.
Isolamento:
Python em .venv com requirements.in → requirements.txt fixado com hashes (pip-tools);
Node com versão fixada em .nvmrc e package-lock.json, instalado via npm ci;
produção em Docker.
A9. Regra de commit, versão e push (gancho after_implement)

Implementado como extensão local do Spec Kit (release), registrada no evento after_implement com optional: false. Mecanismo agnóstico de modelo e de ferramenta. Ao final de todo /speckit.implement:

Rodar os testes. Se falharem, não commitar: reportar e parar.
Propor o incremento SemVer (major/minor/patch) com justificativa de uma linha. Na dúvida, perguntar ao usuário, oferecendo as opções. Enquanto o MVP não estiver completo, a versão fica em 0.x.y.
Atualizar o arquivo VERSION (fonte única, exibida no rodapé da tela do app).
Fazer o commit local com a mensagem: <tipo>(<NNN-feature>): <resumo> [vX.Y.Z] <AAAA-MM-DD HH:MM -03>
Criar a tag anotada vX.Y.Z.
Perguntar se deve fazer o push, mostrando o comando completo e pronto, por exemplo: git push origin 002-inserir-card && git push origin v0.3.0
"Sim" → executar o push. Qualquer outra resposta → manter apenas o commit local.

Se a extensão git embutida registrar ganchos de commit próprios, desative-os para evitar commits duplicados.

A10. Testes (TDD como auditor da spec)
Ciclo Red → Green → Refactor. Os testes nascem das tasks, antes do código.
Pirâmide:
unitários (domínio e aplicação);
integração (API com o Trello simulado);
contrato (contra respostas reais gravadas da API do Trello);
E2E (Playwright em viewport de celular);
regressão (um teste por bug corrigido).
Cobertura mínima: 80% em domain e application. Toda regra do RULES.md precisa de ao menos um teste que a referencie pelo código (ex.: R3).
Regra de ouro: é proibido alterar, apagar ou "consertar" um teste que falha para fazê-lo passar. Mudar um teste exige aprovação humana e atualização da spec.
A11. Limites operacionais da IA (AGENTS.md)
Diretórios: trabalhar apenas em /Projects/myplanner. Proibido ler ou escrever em /opt/myplanner (produção), executar deploy ou alterar o servidor.
Arquivos protegidos: proibido ler, exibir ou editar .env, *.pem, credentials* e arquivos de certificado. Nunca imprimir segredos em outputs, logs ou commits.
Pedir aprovação antes de: chamar serviços externos reais (inclusive a API do Trello), instalar pacotes globais, fazer git push, alterar a constituição ou alterar testes existentes.
Hooks de ferramenta (ex.: bloqueios pré-edição do Cline/Kilo), se existirem, são uma camada opcional a mais. A garantia base é o conjunto pre-commit + .gitignore + gancho do Spec Kit, que independe de ferramenta.