# Regras de negócio

As regras abaixo são classificadas conforme sua origem. “Observada na implementação” descreve comportamento do código, não aprovação automática pelo negócio. As decisões expressamente confirmadas pelo responsável aparecem em seção própria.

## Observadas na implementação

- **Senha inicial e alteração:** a criação do usuário gera senha temporária e marca a conta para troca obrigatória. `PATCH /users` altera a senha da conta autenticada (`sub` e tenant do JWT) e limpa essa marca; o DTO rejeita propriedades extras, como `username`. `POST /users/:username/temporary-password` exige `USERS_UPDATE`, gera senha temporária e volta a exigir troca no próximo acesso. A resposta do reset contém a senha temporária. Evidências: `backend/src/modules/users/users.controller.ts`, `backend/src/modules/users/users.service.ts`, `backend/src/modules/users/users.repository.ts` e `backend/src/modules/users/dtos/update-password.dto.ts`.
- **Pontuação solicitada:** a solicitação registra valor inteiro e descrição, associando usuário solicitante, unidade e tenant, com estado inicial `PENDING`. Valores positivos e negativos representam acréscimo e dedução. Implementação: `backend/src/modules/score-history/score-history.service.ts`, `backend/src/modules/score-history/entity/score-history.entity.ts` e `backend/src/modules/score-history/dtos/score-history.dto.ts`.
- **Decisão de pontuação:** uma solicitação pendente não altera a pontuação geral da unidade. Apenas a aprovação efetiva aplica o valor solicitado; a rejeição atualiza o estado e não altera o saldo. Solicitações aprovadas ou rejeitadas não podem ser processadas novamente. O service não compara solicitante e aprovador, portanto um usuário autorizado pode aprovar a própria solicitação. Implementação: `backend/src/modules/score-history/score-history.service.ts`, `backend/src/modules/score-history/score-history.repository.ts` e `backend/src/modules/units/units.repository.ts`.
- **Unicidade:** username é único por tenant; nome de unidade, nome de papel, SKU de produto e código de localização também têm índices únicos por tenant. Implementação: entidades em `backend/src/modules/users/entities/`, `backend/src/modules/units/entities/`, `backend/src/modules/roles/entities/`, `backend/src/modules/products/entities/` e `backend/src/modules/locations/entities/`.
- **Estoque:** a operação de saída rejeita uma atualização que resulte em saldo geral negativo. `minimumStock` existe como campo do produto, mas não foi localizado código de alerta ou notificação. Implementação: `backend/src/modules/products/products.repository.ts` e `backend/src/modules/products/entities/product.entity.ts`.
- **Alocação:** não permite transferir para a mesma posição; exige a localização de destino no tenant atual; a quantidade solicitada deve estar disponível na origem ou no estoque geral não alocado. Implementação: `backend/src/modules/locations/locations.service.ts`.
- **Posição DISPLAY:** exige capacidade definida; não aceita mais de um produto ativo na posição e não permite exceder a capacidade. Quando há origem, ela deve ser do tipo `STORAGE`. Implementação: `backend/src/modules/locations/locations.service.ts`.
- **Exclusão:** papel em uso não pode ser removido; localização com vínculos de produtos não pode ser removida. Implementação: `backend/src/modules/roles/roles.service.ts` e `backend/src/modules/locations/locations.service.ts`. As exclusões de produtos e categorias são analisadas separadamente abaixo.
- **Autorização:** endpoints anotados exigem a permissão correspondente ao guard. Os endpoints de aprovação, rejeição e consulta de pendências usam `SCORE_HISTORY_APPROVE`; a solicitação usa `SCORE_HISTORY_ADJUST`. Implementação: `backend/src/modules/score-history/score-history.controller.ts` e `backend/src/common/guards/permission.guard.ts`.

## Confirmadas pelo responsável

- A primeira versão do SIGADBV está funcionando em produção.
- Multi-tenancy foi adiado intencionalmente; o tenant é fixo na versão atual. Não deve ser descrito como funcionalidade disponível.
- O fluxo de pontuação funciona conforme esperado em produção. A suite E2E foi atualizada para exercitar solicitação, aprovação, rejeição, rollback e concorrência.
- O administrador gera uma senha temporária; no primeiro acesso, o próprio usuário define a senha definitiva.
- Um usuário pode alterar somente a própria senha; administradores não podem definir diretamente a senha de outra pessoa, mas podem gerar uma nova senha temporária para ela.
- O saldo de uma unidade pode ser negativo. Um usuário com a permissão necessária pode aprovar a própria solicitação; a aprovação deve aplicar a alteração no saldo.
- Ao atingir o estoque mínimo, o comportamento esperado é exibir um alerta e notificar o usuário. Essa funcionalidade é de baixa prioridade e não deve ser tratada como implementada.
- A inconsistência de uso da permissão `SCORE_HISTORY_APPROVE` já foi corrigida. O controller atualmente usa essa permissão nos endpoints de aprovação/rejeição e consulta de pendências.

## Investigações técnicas

### Atomicidade da aprovação de pontuação

**Classificação: Confirmado.** `POST /score-history/:id/approve` executa em `DataSource.transaction()`. Dentro da transação, o service carrega e bloqueia a solicitação, valida o estado `PENDING`, ajusta o saldo da unidade e atualiza o histórico para `APPROVED`. O mesmo `EntityManager` é passado ao repository de histórico e ao `UnitsService`, que o repassa ao `UnitsRepository`; assim, todas as leituras/escritas participantes usam a conexão transacional.

O carregamento da solicitação usa `pessimistic_write`, serializando tentativas concorrentes na mesma linha. Depois de obter o lock, o estado é verificado novamente; a atualização final também condiciona a escrita a `status = PENDING` e exige exatamente uma linha afetada. O saldo usa SQL parametrizado (`score = score + :scoreDelta`) e sua atualização também exige uma linha afetada. Qualquer erro ou resultado inesperado lança exceção dentro do callback transacional, fazendo TypeORM reverter tanto a pontuação quanto o status. Evidências: `backend/src/modules/score-history/score-history.service.ts`, `backend/src/modules/score-history/score-history.repository.ts`, `backend/src/modules/units/units.service.ts` e `backend/src/modules/units/units.repository.ts`.

A rejeição também bloqueia e valida a solicitação pendente dentro de uma transação, atualizando apenas seu status; ela não chama o ajuste de pontuação. Solicitações processadas não passam pela validação de estado e não recebem uma segunda decisão.

### Exclusão de produtos e categorias

- **Código da aplicação:** `DELETE /products/:sku` e `DELETE /categories/:id` chamam `repository.delete`, sem validação prévia de movimentações ou produtos associados. São exclusões físicas; não há uso de exclusão lógica nesses serviços. Exceções do banco são convertidas em erro interno pelos repositories. Evidências: `backend/src/modules/products/products.service.ts`, `backend/src/modules/products/products.repository.ts`, `backend/src/modules/categories/categories.service.ts` e `backend/src/modules/categories/categories.repository.ts`.
- **Metadata ORM:** `Movement.product` declara `onDelete: 'RESTRICT'`; `Product.category` declara `onDelete: 'SET NULL'`; `ProductLocation.product` declara `onDelete: 'CASCADE'`. Se as constraints estiverem criadas conforme esse metadata, movimentações impedem excluir o produto, vínculos de localização são removidos com o produto e a exclusão de categoria desvincula os produtos. Evidências: `backend/src/modules/movements/entities/movement.entity.ts`, `backend/src/modules/products/entities/product.entity.ts` e `backend/src/modules/locations/entities/product-location.entity.ts`.
- **Banco efetivamente implantado:** não foi possível confirmar as constraints da base de produção pelo repositório. O `DataSource` usado para migrações tem `synchronize: false`, e a migração encontrada altera somente `score_history`; não há migração inicial dessas relações nos arquivos inspecionados. A configuração de desenvolvimento pode sincronizar entidades, mas isso não prova o estado da base de produção. Evidências: `backend/src/database/data-source.ts`, `backend/src/app.module.ts` e `backend/src/migration/1791578285982-create-approve-colluns.ts`.
- **Regra de negócio:** permanece **PENDENTE DE VALIDAÇÃO** se a exclusão deve ser bloqueada, permitida com desvinculação ou tratada de outra forma quando existem referências. Restrições técnicas do banco não são consideradas, por si sós, decisão de negócio.

### Respostas HTTP 404 e acesso

- `GET /roles/:id` consulta pelo par `id` e `tenantId`; se não encontrar correspondência, o service lança 404. `PATCH /products/:id` atualiza pelo mesmo par e lança 404 quando nenhuma linha foi afetada. `POST /score-history/:id/approve` busca pelo par `id` e `tenantId` e lança 404 quando não encontra solicitação. Em uma consulta com tenant fixo, um registro com outro `tenantId` não corresponde a esses filtros e recebe o mesmo resultado de não encontrado nesses fluxos. Evidências: `backend/src/modules/roles/roles.repository.ts`, `backend/src/modules/roles/roles.service.ts`, `backend/src/modules/products/products.repository.ts`, `backend/src/modules/products/products.service.ts` e `backend/src/modules/score-history/score-history.repository.ts`.
- `GET /score-history/:unitId` é uma exceção observada: o repository retorna uma lista; se não houver histórico, o service retorna essa lista vazia com sucesso, não 404. Esse fluxo também não consulta a existência da unidade. Evidências: `backend/src/modules/score-history/score-history.repository.ts` e `backend/src/modules/score-history/score-history.service.ts`.
- Para endpoints com `@RequiresPermission`, falta de permissão resulta em 403 antes da busca; falta de sessão JWT resulta em 401. O guard não converte esses casos em 404. Evidências: `backend/src/common/guards/permission.guard.ts` e `backend/src/common/guards/jwt-auth.guard.ts`.
- Os comportamentos acima são específicos dos fluxos citados; não estabelecem uma resposta uniforme para todos os endpoints.

### Paginação

- `PaginationQueryDto` define `page` com padrão 1 e mínimo 1; `limit` com padrão 10, mínimo 1 e máximo 100. Ambos são convertidos para número e validados como inteiros. A `ValidationPipe` global habilita transformação. Evidências: `backend/src/common/dtos/pagination-query.dto.ts` e `backend/src/main.ts`.
- Endpoints que recebem esse DTO passam os valores aos services/repositories, que aplicam `skip = (page - 1) * limit` e `take = limit` em consultas paginadas. Isso inclui listagens de usuários, papéis, produtos, categorias, localizações e movimentações.
- A listagem de unidades usada pela interface não envia parâmetros de paginação. O adapter de histórico de pontuação permite enviar `limit` opcional, mas a tela atual chama a consulta sem valor. Esse endpoint usa `@Query('limit')` separado, sem as validações de faixa declaradas em `PaginationQueryDto`. Evidências: `frontend/src/app/core/infra/adapters/units-api.adapter.ts`, `frontend/src/app/feature/units/units.ts`, `frontend/src/app/core/infra/adapters/score-history-api.adapter.ts` e `backend/src/modules/score-history/score-history.controller.ts`.

## PENDENTES DE VALIDAÇÃO

- Limites de pontuação além da confirmação de que o saldo pode ser negativo.
- Detalhes operacionais do alerta de estoque mínimo, como canais e destinatários da notificação; o comportamento geral desejado está confirmado, mas não implementado e é de baixa prioridade.
- Política de negócio para exclusão de produtos/categorias com referências, conforme descrito acima; também permanece sem confirmação o estado das constraints na base de produção.
- Se existe cliente/frontend fora do código inspecionado que define `page` e `limit` para as APIs paginadas; os adapters atuais examinados não os enviam para as listagens paginadas de cadastros.
- Se deve haver contrato HTTP uniforme para registros não encontrados; os fluxos verificados têm comportamentos específicos, incluindo histórico de pontuação vazio com 200.

## Tenant na versão atual

O responsável confirmou que o tenant é fixo e que multi-tenancy foi adiado. No código, o frontend retorna o slug fixo `sigadbv` e `findTenantIdBySlug` no backend retorna o UUID zero, sem resolver o slug dinamicamente. Isso é compatível com a limitação intencional da versão atual; não constitui suporte a múltiplos tenants. Evidências: `frontend/src/app/core/infra/adapters/url-tenant-context.adapter.ts` e `backend/src/modules/auth/auth.service.ts`.
