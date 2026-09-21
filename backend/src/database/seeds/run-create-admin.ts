import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { runCreateAdminSeed } from './create-admin.seed';

async function execute(): Promise<void> {
  try {
    console.info('🌱 Iniciando contexto para criação de administrador...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    await runCreateAdminSeed(dataSource);

    await app.close();
    process.exit(0);
  } catch (error: unknown) {
    console.error('Erro crítico ao criar administrador:', error);
    process.exit(1);
  }
}

void execute();
