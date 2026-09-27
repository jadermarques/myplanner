# Requirements Quality Checklist: Descrição e confirmação ao salvar

**Purpose**: Valida a qualidade, clareza e completude dos requisitos da 012.
**Created**: 2026-09-27
**Feature**: [spec.md](../spec.md)

**Marker Semantics**: `[x]` = critério revisado e satisfeito (não significa implementação pronta).

## Requirement Completeness

- [ ] CHK001 - Está definido o alvo mínimo de toque do atalho? [Completeness, Spec §FR-001]
- [ ] CHK002 - Está definido o resumo de 2 linhas? [Completeness, Spec §FR-002]
- [ ] CHK003 - Está definido o papel de "voltar" e "limpar"? [Completeness, Spec §FR-003]
- [ ] CHK004 - Está definido que o envio usa o texto completo? [Completeness, Spec §FR-004]
- [ ] CHK005 - Está definido o conteúdo do diálogo de confirmação? [Completeness, Spec §FR-006]

## Requirement Clarity

- [ ] CHK006 - "Preservar o texto ao voltar" está inequívoco? [Clarity, Spec §US1/AC2]
- [ ] CHK007 - "Confirmar sempre" está claro (sem exceção)? [Clarity, Spec §FR-006]
- [ ] CHK008 - "Não abrir dois diálogos nem criar dois cards" está claro? [Clarity, Spec §FR-009]

## Acceptance Criteria Quality

- [ ] CHK009 - SC-002 (0 perda de texto) é verificável? [Measurability, Spec §SC-002]
- [ ] CHK010 - SC-004 (0 sem confirmar; 1 ao confirmar) é verificável? [Measurability, Spec §SC-004]
- [ ] CHK011 - SC-005 (cancelar preserva os campos) é verificável? [Measurability, Spec §SC-005]
- [ ] CHK012 - SC-006 (0 regressões) é verificável? [Measurability, Spec §SC-006]

## Scenario Coverage

- [ ] CHK013 - Abrir a descrição com alvo grande está coberto? [Coverage, Spec §US1/AC1]
- [ ] CHK014 - Voltar e ver o resumo está coberto? [Coverage, Spec §US1/AC2]
- [ ] CHK015 - Reabrir e manter o texto está coberto? [Coverage, Spec §US1/AC3]
- [ ] CHK016 - Limpar está coberto? [Coverage, Spec §US1/AC4]
- [ ] CHK017 - Confirmar/cancelar está coberto? [Coverage, Spec §US2/AC2, AC3]
- [ ] CHK018 - Descrição vazia não gera resumo? [Edge Case, Spec §Edge Cases]
- [ ] CHK019 - Resumo trunca sem empurrar os campos? [Edge Case, Spec §Edge Cases]
- [ ] CHK020 - Validação antes do diálogo (título/limite)? [Edge Case, Spec §FR-008]

## Non-Functional

- [ ] CHK021 - Alvos ≥ 48px (mobile)? [Non-Functional, Spec §SC-001]
- [ ] CHK022 - Acessibilidade do diálogo e dos botões? [Non-Functional, Spec §FR-011]
- [ ] CHK023 - Nenhum segredo/novo dado pessoal em tela? [Non-Functional, S8]
- [ ] CHK024 - Nada de prioridade/campos personalizados entrou aqui? [Scope, Spec §FR-012]

## Traceability

- [ ] CHK025 - Todo requisito deriva do pedido do dono ou de uma decisão registrada? [Traceability, Spec §Clarifications]
