# Arquitetura

## Tecnologias

- **Backend:** Node.js/TypeScript, NestJS 11, TypeORM, PostgreSQL, Redis, Passport/JWT, `class-validator`, Swagger e Helmet. Dependências declaradas em `backend/package.json`.
- **Frontend:** Angular 22, TypeScript 6, RxJS, Tailwind CSS, Chart.js e `ng2-charts`. Dependências declaradas em `frontend/package.json`.
- **Testes:** Jest e Supertest no backend; Vitest e Playwright no frontend.
- Versões e disponibilidade em produção são baseadas nos manifests e no contexto confirmado, respectivamente; os manifests não especificam versões exatas instaladas na produção.

## Organização do backend

O backend segue a estrutura modular do NestJS. `backend/src/app.module.ts` compõe os módulos de autenticação, usuários, papéis, produtos, categorias, localizações, movimentações, unidades e histórico de pontuação.

Nos módulos de negócio, controllers expõem endpoints, services concentram orquestração e regras, e repositories encapsulam acesso a dados. Entidades TypeORM e DTOs de validação definem persistência e contratos de entrada. Dependências são frequentemente conectadas por tokens de interface, por exemplo `IProductsService` e `IProductsRepository`.

Operações de estoque que atualizam saldo do produto e registram movimentação usam transação TypeORM em `backend/src/modules/movements/movements.service.ts`. A aprovação de pontuação também usa `DataSource.transaction()` em `ScoreHistoryService`. Dentro do callback, `ScoreHistoryRepository` bloqueia a solicitação com `pessimistic_write`, valida `PENDING`, e `UnitsService`/`UnitsRepository` aplicam o delta de score; em seguida, `ScoreHistoryRepository` atualiza o status para `APPROVED`. O mesmo `EntityManager` da transação é passado entre service e repositories, e cada repository obtém sua instância TypeORM pelo manager, sem usar o repository global nesse fluxo. A alteração de status é condicional ao estado `PENDING`; os resultados de ambas as atualizações são verificados. Exceções escapam do callback e provocam rollback de status e saldo. A rejeição usa lock/transação e atualização condicional de status, sem ajustar a unidade. Detalhes e regras estão em [regras-de-negocio.md](regras-de-negocio.md).

## Organização do frontend

As rotas em `frontend/src/app/app.routes.ts` carregam páginas standalone sob demanda para autenticação, troca de senha, overview e unidades. O código separa:

- `core/domain`: entidades e enums de domínio;
- `core/application`: modelos e ports de APIs, stores e contexto de tenant;
- `core/infra`: adapters HTTP, guards, interceptors e tokens de injeção;
- `core/store`: estado de autenticação, unidades, usuários e histórico de pontuação;
- `feature`: páginas e jornadas;
- `shared`: componentes e template do relatório de unidades.

O padrão de ports/adapters separa contratos da aplicação dos adapters HTTP e do browser. Stores usam signals do Angular para estado reativo. `frontend/src/app/app.config.ts` registra providers, interceptors e service worker para builds fora do modo de desenvolvimento.

## Banco de dados e infraestrutura

O TypeORM conecta-se ao PostgreSQL pelas variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`; entidades são carregadas automaticamente. `synchronize` é habilitado apenas quando `NODE_ENV` é `development`. Migrations e seeds ficam em `backend/src/migration/` e `backend/src/database/`.

O Redis é configurado por `REDIS_URL` (padrão local no código) e fornece armazenamento com expiração para blacklist de refresh token e chaves relacionadas a usuários. Evidências: `backend/src/common/redis/redis.service.ts`, `backend/src/modules/auth/auth.service.ts`.

As entidades TypeORM declaram ações referenciais para produto, movimentação, localização e categoria. A configuração usada para migrações não sincroniza o schema automaticamente e a migração disponível não documenta essas relações; por isso, o metadata não comprova o estado das constraints no banco de produção. Os efeitos previstos e essa limitação estão registrados em [regras-de-negocio.md](regras-de-negocio.md).

As entidades contêm `tenantId`, e várias consultas aplicam esse campo. Contudo, a versão atual usa um tenant fixo, conforme confirmação do responsável. Multi-tenancy foi adiado intencionalmente e não é funcionalidade disponível nesta versão. O mapeamento dinâmico de tenants e o uso de múltiplas organizações estão fora do escopo atual.

**PENDENTE DE VALIDAÇÃO:** infraestrutura e provedor de produção, topologia, estratégia de backup/recuperação, observabilidade, política de retenção e processo de migrações em produção.

## Autenticação e autorização

- Login emite cookies `access_token` e `refresh_token`; o interceptor retira os tokens do corpo da resposta antes de devolvê-la. Os cookies são `HttpOnly`, `SameSite=Strict`, com tempos de expiração configurados no código. Evidência: `backend/src/common/interceptors/set-cookie.interceptor.ts`.
- O guard JWT global protege rotas por padrão; `@Public()` permite exceções. Refresh e logout usam guard/estratégia de refresh token. Evidências: `backend/src/app.module.ts`, `backend/src/common/guards/jwt-auth.guard.ts`, `backend/src/common/guards/jwt-refresh.guard.ts`.
- `PermissionGuard` compara a permissão requerida com as permissões incluídas no payload do usuário. Evidência: `backend/src/common/guards/permission.guard.ts`.
- Refresh verifica fingerprint de dispositivo e blacklist Redis. Evidências: `backend/src/common/strategies/refresh-token.strategy.ts`, `backend/src/modules/auth/auth.service.ts`.
- O frontend inclui guards de rota e interceptors de autenticação/tenant; essas medidas de interface complementam, mas não substituem, a autorização da API.

## Decisões e controles técnicos observados

- O tenant permanece fixo na versão atual por decisão confirmada do responsável. Embora haja `tenantId` no modelo e headers de contexto, não se deve descrever isso como multi-tenancy disponível. Evidências: `backend/src/modules/auth/auth.service.ts`, `frontend/src/app/core/infra/adapters/url-tenant-context.adapter.ts`.
- O backend configura validação global de DTOs com transformação, whitelist e rejeição de propriedades extras, além de Helmet, CORS com credenciais, Swagger e limite de requisições. Evidências: `backend/src/main.ts`, `backend/src/app.module.ts`.
- Existe um workflow GitHub Actions que valida a branch de origem de pull requests para `main`; não foi localizado nesse workflow um pipeline de build ou testes. Evidência: `.github/workflows/check-pr-source.yml`.
- As permissões de aprovação de pontuação foram corrigidas; o controller atual exige `SCORE_HISTORY_APPROVE` para pendências, aprovação e rejeição, e `SCORE_HISTORY_ADJUST` para solicitar ajuste. Evidência: `backend/src/modules/score-history/score-history.controller.ts`.

**PENDENTE DE VALIDAÇÃO:** requisitos não funcionais formais de disponibilidade, desempenho, escalabilidade, segurança, acessibilidade, compatibilidade de navegadores e recuperação de desastre. As configurações encontradas evidenciam controles implementados, não metas ou garantias de serviço.
