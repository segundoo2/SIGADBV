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

  // Configurações de CORS (corrigido typos da variável de ambiente)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Configuração do Express para Proxy reverso
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.set('trust proxy', 1);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
