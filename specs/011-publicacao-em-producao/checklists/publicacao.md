# Requirements Quality Checklist: Publicação em produção

**Purpose**: Valida a qualidade, clareza e completude dos requisitos de publicação.
**Created**: 2026-09-27
**Feature**: [spec.md](../spec.md)

**Marker Semantics**: `[x]` = critério revisado e satisfeito (não significa implementação pronta).

## Requirement Completeness

- [ ] CHK001 - Está definido o endereço de acesso (IP, sem domínio)? [Completeness, Spec §Clarifications]
- [ ] CHK002 - Está definido quem executa o deploy? [Completeness, Spec §Clarifications]
- [ ] CHK003 - Está definido o destino dos segredos? [Completeness, Spec §FR-004]
- [ ] CHK004 - Está definida a persistência da configuração de TLS? [Completeness, Spec §FR-011]
- [ ] CHK005 - Está definido o comportamento quando o IP muda? [Completeness, Spec §FR-012]

## Requirement Clarity

- [ ] CHK006 - "Certificado confiável no celular" está inequívoco (sem aviso de segurança)? [Clarity, Spec §FR-002]
- [ ] CHK007 - "Renovação automática" está claro e verificável? [Clarity, Spec §FR-003]
- [ ] CHK008 - "Publicar em um comando" está claro? [Clarity, Spec §FR-001]

## Acceptance Criteria Quality

- [ ] CHK009 - SC-001 (≤10 min) é verificável? [Measurability, Spec §SC-001]
- [ ] CHK010 - SC-003 (0 avisos / 0 segredos / 0 portas extras) é verificável? [Measurability, Spec §SC-003]
- [ ] CHK011 - SC-004 (reinício sem intervenção) é verificável? [Measurability, Spec §SC-004]
- [ ] CHK012 - SC-006 (não expirar em 2 ciclos) é verificável? [Measurability, Spec §SC-006]

## Scenario Coverage

- [ ] CHK013 - Publicar do zero e abrir no celular está coberto? [Coverage, Spec §US1]
- [ ] CHK014 - Publicar versão nova sem deslogar está coberta? [Coverage, Spec §US4]
- [ ] CHK015 - Reversão está coberta? [Coverage, Spec §US3]
- [ ] CHK016 - Falha de renovação é perceptível antes de o app parar? [Coverage, Spec §US2/AC2]
- [ ] CHK017 - Servidor reiniciando está coberto? [Edge Case, Spec §Edge Cases]
- [ ] CHK018 - IP mudando está coberto? [Edge Case, Spec §Edge Cases]

## Non-Functional / Segurança

- [ ] CHK019 - Apenas 443/SSH expostas (S7 e aviso do README sobre UFW)? [Security, Spec §FR-008]
- [ ] CHK020 - Nenhum segredo em repositório/imagem/log (S8, A7)? [Security, Spec §FR-004]
- [ ] CHK021 - Cookie `Secure` implica HTTPS obrigatório — coerente com S3/S7? [Security, Spec §FR-002]
- [ ] CHK022 - Nada de banco/múltiplos usuários/CI entrou de contrabando? [Scope, Spec §Assumptions]
- [ ] CHK023 - A ausência de deploy pelo agente está explícita (A11)? [Governança, Spec §FR-013]

## Traceability

- [ ] CHK024 - Todo requisito deriva do pedido do dono ou de uma regra existente (A8/A11/O6)? [Traceability, Spec §Clarifications]
