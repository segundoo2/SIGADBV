# Funcionalidades

Este inventário distingue funcionalidades observadas no código de disponibilidade na interface web. A existência de endpoints não significa que haja uma tela correspondente nem que cada comportamento tenha sido formalmente aprovado.

## Módulos existentes

### Autenticação e sessão

- **Backend:** login, renovação de sessão e logout. A API usa cookies de acesso e refresh; a renovação verifica o fingerprint do dispositivo e consulta a blacklist no Redis. Evidências: `backend/src/modules/auth/auth.controller.ts`, `backend/src/modules/auth/auth.service.ts`, `backend/src/common/strategies/refresh-token.strategy.ts`.
- **Frontend:** formulário de login, proteção de rotas e saída pela interface. Evidências: `frontend/src/app/feature/auth/`, `frontend/src/app/core/infra/guards/`, `frontend/src/app/shared/headers/`.

### Usuários e troca de senha

- **Backend:** criação de usuário com senha temporária, consulta e listagem paginada, alteração de senha, associação/remoção de papéis e exclusão. A criação marca a conta para troca de senha. O contrato de negócio limita a alteração de senha à própria conta; há uma divergência de autorização no endpoint atual, detalhada em [regras-de-negocio.md](regras-de-negocio.md). Evidências: `backend/src/modules/users/users.controller.ts`, `backend/src/modules/users/users.service.ts`.
- **Frontend:** jornada de troca de senha. O contexto confirmado define que o administrador gera a senha temporária e o usuário estabelece a senha definitiva no primeiro acesso. Evidências: `frontend/src/app/feature/update-password/`, `frontend/src/app/core/store/update-password.store.ts`.
- Não foi localizada uma tela de administração de usuários no conjunto de rotas e features inspecionado.

### Papéis e permissões

- **Backend:** CRUD de papéis por tenant e endpoint de metadados de permissões; guard global verifica a permissão requerida pelos endpoints anotados. Evidências: `backend/src/modules/roles/`, `backend/src/common/guards/permission.guard.ts`, `backend/src/common/enum/role/permissions.enum.ts`.
- Não foi localizada uma tela de administração de papéis/permissões nas rotas do frontend.

### Produtos, categorias, localizações e movimentações

- **Backend:**
  - produtos: cadastro, consulta por SKU, listagem paginada, atualização e remoção;
  - categorias: cadastro, consulta, listagem paginada, atualização e remoção;
  - localizações: cadastro, consulta, listagem paginada, atualização e remoção;
  - movimentações: entrada/saída, histórico por produto e alocação/transferência entre localizações.
- Evidências: `backend/src/modules/products/`, `backend/src/modules/categories/`, `backend/src/modules/locations/`, `backend/src/modules/movements/`.
- **Disponibilidade na interface:** não foram encontradas rotas ou features frontend correspondentes a esses módulos. As operações identificadas estão disponíveis na API; a existência de outro cliente não foi verificada.
- As exclusões de produtos e categorias são operações físicas na API. Restrições e efeitos de relacionamentos dependem das chaves estrangeiras efetivamente presentes no banco; ver a análise em [regras-de-negocio.md](regras-de-negocio.md).

### Unidades e pontuação

- **Backend:** CRUD de unidades, consulta de unidades, registro de solicitação de pontuação, histórico por unidade, consulta de pendências, aprovação e rejeição. Uma solicitação pendente não altera o saldo da unidade; a aprovação aplica o ajuste e registra a decisão, enquanto a rejeição registra a decisão sem alterar o saldo. Solicitações já aprovadas ou rejeitadas não podem receber outra decisão. Evidências: `backend/src/modules/units/`, `backend/src/modules/score-history/`.
- **Frontend:** overview com ranking e moderação de solicitações pendentes; lista de unidades, histórico por unidade e geração de relatório para impressão/PDF. Há também formulário para registrar solicitação de pontuação. Evidências: `frontend/src/app/feature/overview/`, `frontend/src/app/feature/units/`, `frontend/src/app/shared/sections/unit-score-manager.component.ts`.
- Não foram encontradas telas de CRUD de unidades. A interface encontrada permite consulta e fluxos de pontuação, não cadastro/edição/remoção de unidade.

## Separação entre frontend e backend

| Área              | Interface Angular                                                  | API NestJS                                                                        |
| ----------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Autenticação      | Login, guards, sessão e logout                                     | Login, refresh e logout                                                           |
| Senhas            | Fluxo de definição da senha definitiva                             | Criação de senha temporária e atualização de senha                                |
| Unidades          | Consulta e exibição de pontuação                                   | CRUD e consulta de unidades                                                       |
| Pontuação         | Solicitação, histórico, aprovação/rejeição no overview e relatório | Solicitação, persistência de histórico, aprovação/rejeição e atualização do saldo |
| Usuários e papéis | Não há telas correspondentes identificadas                         | CRUD/consulta de usuários e papéis, atribuições e permissões                      |
| Estoque           | Não há telas correspondentes identificadas                         | Produtos, categorias, localizações e movimentações                                |

## Testes localizados

No inventário de arquivos foram encontrados 33 testes unitários backend, 4 testes E2E backend, 35 testes unitários frontend e 2 testes E2E frontend. As suites E2E backend abrangem autenticação, histórico de pontuação, unidades e throttle; as E2E frontend abrangem autenticação e troca de senha. A existência dos arquivos não demonstra cobertura percentual. Em 2026-11-06, `pnpm test:e2e` passou com 4 suites e 30 testes no banco de testes configurado.

O E2E de pontuação inclui cenários para solicitação pendente, aprovação positiva/negativa, rejeição, rollback diante de falhas de persistência e tentativas concorrentes, com assertions contra PostgreSQL. Em 2026-11-06, os 10 testes dessa suite passaram. O helper E2E sincroniza e limpa o banco configurado; execute-o somente com um banco de testes descartável.

## Não incluído como funcionalidade disponível

- Multi-tenancy: adiado intencionalmente; a versão atual opera com tenant fixo.
- Gestão de membros: é objetivo de negócio informado pelo responsável, mas não foi localizada implementação correspondente no código inspecionado.
- Recursos futuros de instrução e relatórios de reunião de unidade: mencionados em alto nível em [visao.md](visao.md), não localizados como implementados.
- Alerta e notificação de estoque mínimo: comportamento desejado, de baixa prioridade, mas não localizado como implementado.
- Telas de estoque, usuários e papéis: não localizadas na interface inspecionada.

As evoluções informadas pelo responsável são intenções futuras, não funcionalidades disponíveis. Seus fluxos detalhados, prioridades, cronogramas e critérios de aceite permanecem pendentes de validação. A ausência dos demais itens da interface ou do código não implica compromisso futuro.
