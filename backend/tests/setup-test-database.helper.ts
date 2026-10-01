import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SYSTEM_ADMIN_ROLE_NAME } from '../src/common/enum/role/permissions.enum';
import { Role } from '../src/modules/roles/entities/role.entity';
import { User } from '../src/modules/users/entities/user.entity';

export const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000000';
export const MOCK_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
export const MOCK_ROLE_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

export async function setupTestDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);

  await dataSource.synchronize(true);

  const plainPassword = 'password123';
  const saltRounds = 4;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  // 1. Cria a Role com todas as permissões de unit explícitas exigidas pelo Guard
  const roleRepository = dataSource.getRepository(Role);
  let superAdminRole = await roleRepository.findOne({
    where: { name: SYSTEM_ADMIN_ROLE_NAME, tenantId: MOCK_TENANT_ID },
  });

  const explicitPermissions = [
    'unit.create',
    'unit.read',
    'unit.update',
    'unit.delete',
    'users.create',
    'users.read',
    'products.create',
    'products.read',
  ];

  if (!superAdminRole) {
    superAdminRole = roleRepository.create({
      id: MOCK_ROLE_ID,
      name: SYSTEM_ADMIN_ROLE_NAME,
      permissions: explicitPermissions,
      tenantId: MOCK_TENANT_ID,
    });
    await roleRepository.save(superAdminRole);
  } else {
    superAdminRole.permissions = Array.from(
      new Set([...(superAdminRole.permissions || []), ...explicitPermissions]),
    );
    await roleRepository.save(superAdminRole);
  }

  // 2. Cria o usuário de teste vinculando a role
  const userRepository = dataSource.getRepository(User);
  const user = userRepository.create({
    id: MOCK_USER_ID,
    username: 'test.user',
    password: hashedPassword,
    tenantId: MOCK_TENANT_ID,
    roles: [superAdminRole],
  });

  await userRepository.save(user);
}

export async function cleanTestDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  if (dataSource.isInitialized) {
    await dataSource.query('TRUNCATE TABLE users CASCADE;');
  }
}
