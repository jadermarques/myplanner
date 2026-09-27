# Feature Specification: Publicação em produção (app acessível pelo celular, de qualquer lugar)

**Feature Branch**: `011-publicacao-em-producao`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "poderia colocar o push na vps e me indicar como eu acesso?"

## Clarifications

### Session 2026-09-27 — decidido pelo agente, com o dono

- Q: O acesso é por domínio próprio ou pelo IP do servidor? → A: **pelo IP** (a A8 já fixa: HTTPS
  obrigatório mesmo acessando só por IP; domínio próprio não está no escopo desta versão).
- Q: Quem executa o deploy? → A: **o dono**. O agente prepara os artefatos e o roteiro; alterar o
  servidor é proibido pela A11 — o agente **não** executa deploy, nem com aprovação.
- Q: Deploy automático (pipeline) agora? → A: **não**. Um roteiro manual de poucos comandos é o
  proporcional (A6); entrega contínua entra quando houver gatilho real (ex.: mais de uma pessoa
  publicando).
- Q: O que acontece com a sessão de 90 dias quando o certificado renovar? → A: **nada** — a sessão é
  assinada por segredo próprio do app, não pelo certificado. Renovar não desloga.
- Q: Onde ficam os segredos? → A: **só no servidor**, num arquivo não versionado (`.env`), criado pelo
  dono. Nunca no repositório, na imagem ou em log (S8).
- Q: O app precisa funcionar offline em produção? → A: não; sem internet ele segue apenas avisando que
  precisa de conexão (não objetivo do produto).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir o app no celular, de qualquer rede (Priority: P1)

Como usuário único, quero publicar uma versão etiquetada e abrir o app no celular pelo endereço do
servidor, de qualquer lugar, para lançar cards sem depender do computador de casa estar ligado.

**Why this priority**: é a razão de existir desta feature — hoje o app só funciona na rede local.

**Independent Test**: publicar a tag atual e, no celular **fora do Wi-Fi de casa**, abrir o endereço,
entrar com a senha e criar um card.

**Acceptance Scenarios**:

1. **Given** uma versão etiquetada, **When** o dono segue o roteiro de publicação, **Then** o app fica
   disponível por um endereço **HTTPS com certificado confiável** (sem aviso de segurança).
2. **Given** o app aberto no celular, **When** o usuário entra com a senha e cria um card, **Then** o
   card aparece no Trello, com os campos escolhidos.
3. **Given** o app aberto no celular, **When** o usuário instala como app na tela inicial, **Then** ele
   abre em tela cheia e continua falando com o servidor.

---

### User Story 2 - Não me preocupar com o certificado (Priority: P1)

Como usuário único, quero que o certificado se renove sozinho, para nunca ver "não seguro" nem precisar
agir a cada poucos dias (o certificado por IP é de curta duração).

**Why this priority**: sem isso o app para de funcionar em poucos dias, silenciosamente.

**Independent Test**: deixar a rotina de renovação rodar dois ciclos e conferir que o certificado em uso
nunca ficou vencido.

**Acceptance Scenarios**:

1. **Given** o certificado de curta duração, **When** a rotina de renovação roda, **Then** o certificado
   em uso é substituído sem derrubar a sessão nem exigir ação manual.
2. **Given** uma falha de renovação, **When** o dono consulta o servidor, **Then** consegue ver que a
   renovação falhou **antes** de o app parar de abrir.

---

### User Story 3 - Voltar atrás rápido (Priority: P2)

Como usuário único, quero conseguir voltar para a versão anterior quando algo quebrar, para não ficar
sem o app por muito tempo.

**Independent Test**: publicar uma tag, reverter para a anterior e conferir que o app volta a funcionar.

**Acceptance Scenarios**:

1. **Given** uma versão nova com problema, **When** o dono reverte para a tag anterior, **Then** o app
   volta a funcionar em poucos minutos e sem reconfigurar segredos.

---

### User Story 4 - Publicar uma versão nova sem perder o acesso (Priority: P2)

**Why this priority**: publicar é rotina; o login não pode ser perdido a cada publicação.

**Acceptance Scenarios**:

1. **Given** uma sessão ativa no celular, **When** o dono publica uma tag nova, **Then** o app continua
   logado e o rodapé mostra a versão nova.

### Edge Cases

- Servidor reinicia (manutenção ou queda): o app volta sozinho, sem intervenção.
- O servidor troca de IP: o certificado é do endereço antigo — precisa ser reemitido para o novo
  (situação documentada no roteiro, não silenciosa).
- Renovação falha por duas vezes seguidas: precisa ser perceptível antes de o app parar de abrir.
- Porta além das necessárias exposta: é falha de segurança, não conveniência (Docker publica portas
  ignorando o firewall do sistema).
- Rebuild sem persistência de dados: não pode fazer o app perder a configuração de TLS e reemitir sem
  parar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: DEVE existir um pacote de produção que sobe o app inteiro (interface + servidor) em
  **um** comando documentado, a partir de uma **tag** versionada.
- **FR-002**: O acesso DEVE ser por **HTTPS em `https://<IP>`**, com certificado **emitido por
  autoridade pública e confiável no celular** — sem tela de aviso de segurança.
- **FR-003**: A renovação do certificado DEVE ser **automática e agendada**, sem ação manual, e DEVE ser
  possível verificar que ela ocorreu.
- **FR-004**: Os segredos DEVEM viver **apenas** no servidor, em arquivo não versionado; **nunca** no
  repositório, na imagem ou em log (S8, A7).
- **FR-005**: O app DEVE voltar sozinho depois de reinício do servidor (subida automática no boot).
- **FR-006**: Publicar uma tag nova NÃO DEVE exigir reconfigurar segredos nem DEVE deslogar o usuário
  (sessão de 90 dias preservada).
- **FR-007**: DEVE existir caminho de **reversão** para a tag anterior, documentado, executável pelo dono
  em poucos minutos.
- **FR-008**: Apenas as portas necessárias DEVEM ficar expostas (HTTPS e SSH); a interface e o servidor
  **não** DEVEM ser publicados diretamente.
- **FR-009**: O endereço publicado DEVE continuar servindo o PWA instalável, e as atualizações DEVEM
  chegar sem reinstalar o app.
- **FR-010**: Login (senha única, sem segundo fator — ADR 0004) e criação de cards DEVEM continuar
  funcionando exatamente como hoje.
- **FR-011**: Dados de configuração de TLS DEVEM ser **persistentes** entre rebuilds e reinícios.
- **FR-012**: O roteiro DEVE cobrir o que fazer quando o IP do servidor mudar.
- **FR-013**: DEVE existir uma verificação local do pacote (validação da configuração e subida dos
  serviços com `GET /health` respondendo) antes de publicar — **limitação conhecida**: nesta máquina o
  daemon do Docker está parado, então a validação de subida depende de o dono ligá-lo (a validação de
  sintaxe da configuração não depende).
- **FR-014**: Nada do que existe DEVE regredir: as suítes (backend, unidade, E2E) e o fluxo de
  desenvolvimento local DEVEM continuar funcionando.

### Key Entities

- **Pacote de produção**: conjunto versionado de artefatos que sobe interface + servidor + proxy.
- **Configuração do servidor**: arquivo de segredos (do dono) + dados persistentes de TLS.
- **Roteiro de publicação**: passos de publicar, verificar e reverter, em pt-BR.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Publicar uma tag do zero até o app abrir no celular em **≤ 10 minutos** seguindo o roteiro.
- **SC-002**: Criar um card no celular pelo endereço HTTPS, de **fora da rede de casa**, mantendo o
  critério do produto (≤ 10 s por card, sem contar digitação).
- **SC-003**: **0** avisos de segurança no navegador do celular; **0** segredos encontrados por varredura
  no repositório; **0** portas publicadas além de **80** (apenas para validar o certificado do IP e para
  redirecionar para HTTPS — *ajuste durante o research: o RFC 8738 permite validar IP por HTTP-01, o que
  mantém a renovação sem downtime*), **443** e SSH.
- **SC-004**: Reiniciar o servidor → app volta sozinho, **0** intervenções.
- **SC-005**: Reverter para a tag anterior em **≤ 5 minutos**.
- **SC-006**: O certificado em uso **não expira** ao longo de dois ciclos de renovação consecutivos.
- **SC-007**: **0** regressões nas três camadas de teste.

## Assumptions

- Servidor Ubuntu com Docker e IP público (documentado no `README.md`); publicação **manual por tag**.
- **Sem domínio próprio** nesta versão: o endereço é `https://<IP>` (A8).
- **Sem banco de dados** e **sem múltiplos usuários** — nada disso entra aqui (não objetivos).
- O agente entrega artefatos e roteiro; **a execução no servidor é do dono** (A11).
- Sem nova biblioteca de aplicação; a única adição é infraestrutura de empacotamento.

