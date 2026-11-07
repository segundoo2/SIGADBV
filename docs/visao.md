# Visão do SIGADBV

## Contexto e problema

O SIGADBV é um modelo de ERP para clubes de desbravadores da Igreja Adventista do Sétimo Dia. Ele surgiu para facilitar a administração das unidades, membros e automatizar processos que antes eram tratados verbalmente ou em papel. Esses processos manuais geravam trabalho adicional e reduziam a produtividade do clube.

O repositório já contém recursos para unidades e pontuação, usuários e permissões, além de cadastros e operações de estoque. A gestão de membros, embora faça parte do objetivo de negócio informado, não foi localizada como funcionalidade implementada.

## Objetivos

Objetivos informados pelo responsável:

- facilitar a administração das unidades e dos membros do clube;
- automatizar processos operacionais antes realizados verbalmente ou em papel, reduzindo trabalho manual e favorecendo a produtividade.

As funcionalidades técnicas atualmente encontradas estão descritas em [funcionalidades.md](funcionalidades.md). **PENDENTE DE VALIDAÇÃO:** prioridades entre objetivos e indicadores para medir a redução de trabalho e o ganho de produtividade.

## Público-alvo e usuários

O público-alvo principal são os líderes dos clubes de desbravadores. O contexto confirmado também contempla um administrador, que gera a senha temporária de um usuário, e o usuário, que define sua senha definitiva no primeiro acesso. A interface e a API contêm papéis e permissões configuráveis. A evolução futura poderá ampliar o público atendido para atividades de instrução e relatórios de unidade.

**PENDENTE DE VALIDAÇÃO:** perfis oficiais, responsabilidades e relação dos módulos de estoque com o público-alvo principal.

## Visão geral da solução

O produto tem uma API NestJS e uma aplicação web Angular. A interface oferece login, troca de senha, overview e consulta de unidades, com operações de pontuação e histórico. A API contém também módulos para usuários, papéis, produtos, categorias, localizações e movimentações de estoque. Os módulos de estoque não aparecem como jornadas nas rotas do frontend atualmente mapeadas.

O responsável confirmou que a primeira versão está funcionando em produção. Essa informação não especifica provedor, topologia, disponibilidade, volume ou ambiente de hospedagem.

## Escopo atual e funcionalidades futuras

O escopo atual documentado corresponde aos recursos encontrados no código e discriminados em [funcionalidades.md](funcionalidades.md). A implantação atual usa um tenant fixo. A implementação de multi-tenancy foi intencionalmente adiada; portanto, multi-tenancy **não é apresentada como funcionalidade disponível**.

Como evoluções futuras de alto nível, o responsável mencionou recursos de instrução e relatórios de reunião de unidade. Essas capacidades não foram localizadas como implementadas no repositório. A gestão de membros também é um objetivo de negócio informado, mas não foi localizada como funcionalidade implementada. **PENDENTE DE VALIDAÇÃO:** escopo, prioridade, cronograma e critérios de aceite dessas evoluções.

## Base das informações

- Descrição da API: `backend/src/main.ts`.
- Rotas e módulos web: `frontend/src/app/app.routes.ts`.
- Módulos da API: `backend/src/app.module.ts`.
- Contexto de negócio, público-alvo, objetivos e evolução futura: contexto confirmado pelo responsável nesta auditoria.
- Situação da versão em produção e decisões de escopo: contexto confirmado pelo responsável nesta auditoria.
