# Ambiente local de integração

O `compose.production-sim.yaml` sobe PostgreSQL, Redis, a API compilada em modo `production` e o frontend compilado servido por Nginx com HTTPS. O Nginx entrega a interface e encaminha `/api/*` para o backend na mesma origem, permitindo exercitar os cookies `Secure`, `HttpOnly` e `SameSite=Strict` junto com o CORS e a autenticação.

## Iniciar

Na raiz do repositório:

```sh
docker compose -f compose.production-sim.yaml up --build
```

Acesse [https://localhost:8443](https://localhost:8443). O certificado é autoassinado e tem validade de 30 dias; o navegador pode pedir que você aceite o certificado local.

O usuário inicial do banco isolado é `sg.code`, com senha `LocalTestPass123`. Essa credencial e os secrets no compose são somente para a simulação local. O banco é criado em um volume Docker próprio.

## Verificar a integração no navegador

Com os containers ativos, em outro terminal:

```sh
cd frontend
pnpm test:e2e:integration
```

O teste usa o Chromium do Playwright e verifica login na API real, cookies seguros e carregamento de unidades pelo frontend. Essa suíte não substitui os testes E2E mockados existentes.

## Encerrar e limpar

```sh
docker compose -f compose.production-sim.yaml down
```

Para apagar também o banco e começar novamente com o administrador inicial:

```sh
docker compose -f compose.production-sim.yaml down -v
```

O container da API sincroniza o schema TypeORM no banco dedicado da simulação antes de iniciar. O projeto ainda não tem migrações que criem o schema completo; por isso essa sincronização é restrita a esse compose de teste. Não conecte esse ambiente a dados de produção e não reutilize seus secrets em qualquer instalação real.
