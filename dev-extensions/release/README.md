# Extensão local `release`

Implementa a regra **A9** (commit, versão e push) como gancho obrigatório do evento
`after_implement` do Spec Kit. Ver `AGENTS.md` (A9).

## Instalação (local)

```bash
specify extension add --dev dev-extensions/release
```

## Comportamento

Ao final de todo `/speckit.implement`, o gancho executa o comando `speckit.release.commit`, que:

1. roda os testes (falhou → não commita);
2. propõe incremento SemVer (major/minor/patch) com justificativa de uma linha;
3. atualiza o arquivo `VERSION`;
4. faz commit local com a mensagem canônica;
5. cria a tag anotada `vX.Y.Z`;
6. pergunta sobre o push (só executa com "Sim").

Nenhum passo faz push sem confirmação explícita do usuário.
