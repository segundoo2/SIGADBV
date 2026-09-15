import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Application } from 'express';
import helmet from 'helmet';
import { PermissionsMetadataDto } from './modules/roles/permissions.controller';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do class-validator/class-transformer
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('StockUp API')
    .setDescription(
      'Documentação da API do StockUp, um sistema de gestão e controle de estoque.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [PermissionsMetadataDto],
  });

  SwaggerModule.setup('api', app, document);

  // Configuração de parsing de cookie
  app.use(cookieParser());

  // Configurações do Helmet (permitindo inline scripts/styles para renderização do Swagger UI)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'blob:'],
          scriptSrc: [`'self'`, `'unsafe-inline'`],
        },
      },
      crossOriginEmbedderPolicy: false,
      hidePoweredBy: true,
    }),
  );

  // Configuração de CORS: libera sem origem em dev, e valida subdomínios dinâmicos
  const baseOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:4200'];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // 1. Libera requisições sem origem estritamente em desenvolvimento (Postman/cURL)
      if (!origin) {
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev) {
          callback(null, true);
          return;
        } else {
          callback(new Error('Requisições sem origem não são permitidas.'));
          return;
        }
      }

      // 2. Validação de exatidão ou subdomínios dinâmicos
      const isAllowed = baseOrigins.some((base) => {
        if (origin === base) return true;

        try {
          const url = new URL(base);
          const hostname = url.hostname;
          const protocol = url.protocol;
          const port = url.port ? `:${url.port}` : '';

          const escapedHostname = hostname.replace(/\./g, '\\.');
          const wildcardRegex = new RegExp(
            `^${protocol}//([a-zA-Z0-9_-]+\\.)?${escapedHostname}${port}$`,
          );

          return wildcardRegex.test(origin);
        } catch {
          return false;
        }
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado pela política de CORS'));
      }
    },
    credentials: true,
  });

  // Configuração do Express para Proxy reverso
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.set('trust proxy', 1);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
