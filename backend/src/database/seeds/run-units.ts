import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { seedUnits } from './units.seed'; // Função de inserção dos dados

async function execute(): Promise<void> {
  try {
    console.info('🌱 Iniciando contexto para seed de unidades...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    await seedUnits(dataSource);

    await app.close();
    process.exit(0);
  } catch (error: unknown) {
    console.error('Erro crítico ao executar o seed de unidades:', error);
    process.exit(1);
  }
}

void execute();
