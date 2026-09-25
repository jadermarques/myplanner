---
description: "Aplica a regra A9: testar, versionar (SemVer), atualizar VERSION, commitar, criar tag e sugerir push após a implementação"
---

# Release (regra A9)

Gancho obrigatório (`optional: false`) registrado no evento `after_implement`. Ao final de
todo `/speckit.implement`, execute em ordem e pare no primeiro passo que falhar.

## Procedimento

1. **Rodar os testes**
   - Execute a suíte de testes do projeto.
   - Se qualquer teste falhar, **não commite**: reporte a falha e encerre o gancho.

2. **Propor incremento SemVer** (major/minor/patch)
   - Justifique em uma linha.
   - Na dúvida, pergunte ao usuário oferecendo as opções (major/minor/patch).
   - Enquanto o MVP não estiver completo, mantenha a versão em `0.x.y`.

3. **Atualizar o arquivo `VERSION`**
   - Fonte única da versão, exibida no rodapé da tela do app.

4. **Fazer o commit local**
   - Mensagem: `<tipo>(<NNN-feature>): <resumo> [vX.Y.Z] <AAAA-MM-DD HH:MM -03>`

5. **Criar a tag anotada**
   - `git tag -a vX.Y.Z -m "<resumo>"`

6. **Perguntar sobre o push**
   - Mostre o comando completo e pronto, por exemplo:
     `git push origin 002-inserir-card && git push origin v0.3.0`
   - Resposta "Sim" → execute o push. Qualquer outra resposta → mantenha apenas o commit local.

## Guardrails

- Se a extensão git embutida registrar ganchos de commit próprios (`speckit.git.commit`),
  desative-os para evitar commits duplicados.
- Nunca imprima segredos (tokens, senhas) em mensagens de commit, tags ou saídas.
- Não faça push sem confirmação explícita do usuário.
