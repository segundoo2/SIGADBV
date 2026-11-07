# Deploy sem Docker

Este guia descreve o fluxo da aplicação em hospedagens que executam Node.js e servem arquivos estáticos sem construir containers. Os nomes dos comandos são os scripts definidos pelo projeto; configure os comandos equivalentes no provedor escolhido.

## Componentes necessários

- Um serviço Node.js para a API NestJS.
- Um serviço PostgreSQL acessível pela API.
- Um serviço Redis acessível pela API.
- Um serviço estático ou CDN para publicar o frontend Angular.
- Domínios HTTPS para a interface e para a API.

PostgreSQL e Redis não precisam ser hospedados junto da API, mas precisam aceitar conexões do serviço backend. Configure TLS nas URLs quando o provedor exigir. O cliente Redis reconhece URLs `rediss://`.

## Domínios, cookies e CORS

O frontend de produção aponta para `https://api.sigadbv.sgcode.com.br`, conforme `frontend/src/app/core/infra/tokens/url.token.ts`. Para usar outro domínio de API, altere essa URL no código e gere novamente o build do frontend.

Configure `ALLOWED_ORIGINS` com a origem exata do frontend, incluindo protocolo e sem barra final, por exemplo `https://sigadbv.sgcode.com.br`. Configure `FRONTEND_URL` com a URL pública do frontend; o valor é usado em mensagens da API.

Login e chamadas autenticadas usam cookies `HttpOnly`, `Secure` e `SameSite=Strict`, além de requisições com credenciais. Para que o navegador aceite os cookies entre os domínios, prefira frontend e API em subdomínios do mesmo domínio principal, como `sigadbv.sgcode.com.br` e `api.sigadbv.sgcode.com.br`. Domínios padrão diferentes do provedor podem bloquear cookies entre sites.

## Variáveis da API

Cadastre as variáveis no ambiente do serviço backend, sem colocá-las no repositório:

| Variável | Uso |
| --- | --- |
| `DB_HOST`, `DB_PORT` | Host e porta PostgreSQL |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Banco, usuário e senha PostgreSQL |
| `DB_SSL` | Use `true` quando o provedor exigir TLS para PostgreSQL |
| `DB_SSL_REJECT_UNAUTHORIZED` | Valida o certificado TLS por padrão; altere somente se o provedor exigir |
| `DB_CHANNEL_BINDING` | Habilita SCRAM channel binding quando exigido pelo provedor |
| `REDIS_URL` | URL de conexão Redis, usando `rediss://` quando TLS for necessário |
| `JWT_SECRET` | Secret de assinatura dos tokens de acesso; mínimo de 32 bytes |
| `JWT_REFRESH_SECRET` | Secret diferente para refresh tokens; mínimo de 32 bytes |
| `ALLOWED_ORIGINS` | Origem pública do frontend |
| `FRONTEND_URL` | URL pública do frontend |
| `ADMIN_PASSWORD` | Senha inicial do administrador, exigida pelo script de deploy |
| `ADMIN_USERNAME` | Nome do administrador; opcional, padrão `sg.code` |
| `PORT` | Porta fornecida pela plataforma; a API usa `3000` como padrão |

O backend valida que os secrets JWT estejam configurados, tenham tamanho suficiente e sejam diferentes em produção.

## Comandos de deploy da API

Na pasta `backend`, instale as dependências compatíveis com o build e execute o comando de início:

```sh
pnpm install --frozen-lockfile
pnpm deploy:prod
```

O script compila o backend, valida os secrets, prepara o schema e aplica migrations pendentes, garante o administrador e inicia a API em modo de produção. Ele exige as variáveis descritas acima, incluindo `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `REDIS_URL` e `ADMIN_PASSWORD`. Se houver `backend/.env.production` (ou `backend/.env`), o script a carrega automaticamente; em provedores gerenciados, cadastre essas mesmas variáveis no painel.

O preparo do schema cria as tabelas quando o banco está vazio. Em um banco existente, verifica tabelas e colunas antes de reconciliar o histórico de migrations. Se detectar schema parcial/incompatível ou registros antigos de pontuação sem solicitante identificável, interrompe o deploy para evitar alterações inseguras. Faça backup do banco antes de executar o primeiro deploy com migrations.

O seed do administrador é idempotente: cria a conta quando não existe e garante a role de administrador. Ele não altera a senha de uma conta já existente.

## Comandos de deploy do frontend

Na pasta `frontend`, instale dependências, gere o build e publique o diretório gerado:

```sh
pnpm install --frozen-lockfile
pnpm build
```

Publique `frontend/dist/frontend/browser` como conteúdo estático. Configure o servidor para encaminhar rotas desconhecidas da aplicação para `index.html`, como exige o roteamento SPA do Angular. O arquivo `frontend/vercel.json` contém uma configuração de build, saída e rewrite para Vercel; em outros provedores, configure o equivalente.

## Alterações de entidades e migrations

Quando uma entidade mudar, gere a migration em ambiente local ou staging com o schema atualizado:

```sh
cd backend
pnpm migration:generate src/migration/NomeDescritivo
```

Revise a migration gerada, versione-a e inclua-a no deploy. O deploy aplica migrations pendentes, mas não gera migrations automaticamente. Não gere migrations contra o banco de produção durante a inicialização do serviço.

## Verificação após publicar

Depois do deploy, confira no provedor:

1. Se o processo da API iniciou e permaneceu ativo.
2. Se o endpoint `/api-json` responde pela URL HTTPS da API.
3. Se o frontend carrega e as chamadas à API não apresentam erros de CORS ou cookies.
4. Se login, renovação de sessão e logout funcionam no domínio público.
5. Se a migration e a criação do usuário administrador terminaram sem erro nos logs.
