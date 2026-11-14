import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Role } from '../src/modules/roles/entities/role.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { EPermission } from '../src/common/enum/role/permissions.enum';
import { setupTestDatabase } from './setup-test-database.helper';

export const E2E_USER_AGENT = 'SIGADBV-E2E-Client';

export function parseCookies(
  rawCookies: string | string[] | undefined,
): string {
  if (!rawCookies) return '';
  const values = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
  return values
    .map((cookie) => cookie.split(';')[0])
    .filter(Boolean)
    .join('; ');
}

export async function createE2eApplication(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  await setupTestDatabase(app);
  return app;
}

export async function loginE2eUser(
  httpServer: Server,
  username = 'test.user',
  password = 'password123',
): Promise<string> {
  const response = await request(httpServer)
    .post('/auth/')
    .set('x-tenant-slug', 'test-tenant')
    .set('user-agent', E2E_USER_AGENT)
    .send({ username, password })
    .expect(200);
  return parseCookies(response.get('Set-Cookie'));
}

export async function createE2eUser(
  app: INestApplication,
  username: string,
  permissions: EPermission[],
  password = 'Password123',
): Promise<void> {
  const dataSource = app.get(DataSource);
  const roleRepository = dataSource.getRepository(Role);
  const role = await roleRepository.save(
    roleRepository.create({
      name: `role-${username}`,
      tenantId: '00000000-0000-0000-0000-000000000000',
      permissions,
    }),
  );
  const userRepository = dataSource.getRepository(User);
  await userRepository.save(
    userRepository.create({
      username,
      password: await bcrypt.hash(password, 4),
      tenantId: '00000000-0000-0000-0000-000000000000',
      mustChangePassword: false,
      roles: [role],
    }),
  );
}

export function createTestProduct(sku: string) {
  return {
    sku,
    name: `Produto ${sku}`,
    price: 12.5,
    costPrice: 6,
    minimumStock: 1,
    uom: 'UN',
  };
}
