# Desenvolvimento local com Docker

Na raiz do repositório, inicie os serviços:

```sh
docker compose -f compose.dev.yaml up
```

Abra o frontend em [http://localhost:4200](http://localhost:4200). O Swagger da API fica em [http://localhost:3000/api](http://localhost:3000/api), e o documento OpenAPI em [http://localhost:3000/api-json](http://localhost:3000/api-json).

Angular e NestJS são iniciados em modo de desenvolvimento e observam os arquivos montados do host. PostgreSQL reutiliza o volume do banco de testes existente, e Redis persiste seus dados em um volume próprio. O comando `down` não remove esses volumes.

Para parar os serviços:

```sh
docker compose -f compose.dev.yaml down
```

O backend habilita `synchronize` do TypeORM em `NODE_ENV=development`, conforme a configuração de desenvolvimento do projeto. Use este ambiente somente com o banco de testes local.
