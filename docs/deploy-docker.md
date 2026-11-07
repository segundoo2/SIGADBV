# Deploy com Docker

Este é o procedimento de deploy com Docker Compose em um servidor. Para uma hospedagem sem Docker, consulte [deploy-sem-docker.md](deploy-sem-docker.md).

O Compose inicia containers para a API, a interface web, PostgreSQL e Redis. Os dados dos dois serviços de armazenamento ficam em volumes persistentes e as portas de PostgreSQL e Redis não são publicadas no host. Na primeira inicialização, o serviço `migrate` cria o schema e aplica as migrations pendentes antes de liberar a inicialização da API. Nas inicializações seguintes, ele aplica apenas migrations ainda não executadas.

Copie `backend/.env.example` para `backend/.env.production` e preencha as variáveis de produção. Configure `DB_HOST` com o host PostgreSQL acessível fora dos containers se também for usar `pnpm deploy:prod`; o Compose substitui esse valor por `database` dentro dos containers. Use valores hexadecimais para `DB_PASSWORD` e `REDIS_PASSWORD`, pois o Compose monta a URL interna do Redis. Os secrets JWT precisam ter pelo menos 32 bytes e ser diferentes. Arquivos `.env.production` estão ignorados pelo Git.

```sh
docker compose --env-file backend/.env.production -f compose.prod.yaml up -d --build
```

A API fica publicada somente em `127.0.0.1:3000` e o frontend em `127.0.0.1:8080`. Configure o proxy HTTPS do servidor para encaminhar `https://api.sigadbv.sgcode.com.br` à porta 3000 e `https://sigadbv.sgcode.com.br` à porta 8080. O frontend usa a URL da API definida no código em `core/infra/tokens/url.token.ts`.

Não há seed de unidades no Compose. A criação do administrador e a sincronização de permissões são operações separadas; para o fluxo completo sem Docker, use o script documentado em [deploy-sem-docker.md](deploy-sem-docker.md).

Para parar os containers sem remover os dados persistidos:

```sh
docker compose --env-file backend/.env.production -f compose.prod.yaml down
```
