import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { Role } from '../../modules/roles/entities/role.entity';
import { syncAdminRolePermissions } from './run-sync-permission.seed';

async function execute(): Promise<void> {
  try {
    console.info('🌱 Iniciando contexto para sincronização de permissões...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const roleRepository = dataSource.getRepository(Role);

    await syncAdminRolePermissions(roleRepository);

    console.info('✨ Permissões sincronizadas com sucesso!');
    await app.close();
    process.exit(0);
  } catch (error: unknown) {
    console.error('Erro crítico ao sincronizar permissões:', error);
    process.exit(1);
  }
}

void execute();
