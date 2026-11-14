import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  EPermission,
  SYSTEM_ADMIN_ROLE_NAME,
} from '../../src/common/enum/role/permissions.enum';
import { Role } from '../../src/modules/roles/entities/role.entity';
import {
  createE2eApplication,
  createE2eUser,
  E2E_USER_AGENT,
  loginE2eUser,
} from '../e2e-helpers';
import {
  cleanTestDatabase,
  MOCK_ROLE_ID,
  MOCK_TENANT_ID,
} from '../setup-test-database.helper';

describe('Roles and permission endpoints (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let adminCookie: string;
  let readerCookie: string;
  let adminRole: Role;
  let createdRoleId: string;
  const createdRoleName = `e2e-role-${Date.now()}`;

  beforeAll(async () => {
    app = await createE2eApplication();
    httpServer = app.getHttpServer() as Server;
    adminCookie = await loginE2eUser(httpServer);
    await createE2eUser(app, 'role.reader', [EPermission.USERS_READ]);
    readerCookie = await loginE2eUser(httpServer, 'role.reader', 'Password123');
    adminRole = await app.get(DataSource).getRepository(Role).findOneByOrFail({
      id: MOCK_ROLE_ID,
      tenantId: MOCK_TENANT_ID,
    });
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  it('returns permission metadata and requires authentication', async () => {
    const response = await request(httpServer)
      .get('/permissions')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(response.body.permissions).toEqual(Object.values(EPermission));
    expect(response.body.systemAdminRole).toBe(SYSTEM_ADMIN_ROLE_NAME);
    await request(httpServer).get('/permissions').expect(401);
  });

  it('creates roles and rejects invalid permissions and duplicate names', async () => {
    const response = await request(httpServer)
      .post('/roles')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: createdRoleName, permissions: [EPermission.PRODUCTS_READ] })
      .expect(201);
    createdRoleId = response.body.data.id as string;
    expect(response.body.data.name).toBe(createdRoleName);
    await request(httpServer)
      .post('/roles')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: createdRoleName, permissions: [EPermission.PRODUCTS_READ] })
      .expect(409);
    await request(httpServer)
      .post('/roles')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'cargo-invalido', permissions: ['permissions.invalid'] })
      .expect(400);
    await request(httpServer)
      .post('/roles')
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'sem-sessao', permissions: [] })
      .expect(401);
    await request(httpServer)
      .post('/roles')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'sem-permissao', permissions: [] })
      .expect(403);
  });

  it('lists and finds roles with pagination and returns not-found for missing roles', async () => {
    const list = await request(httpServer)
      .get('/roles')
      .query({ page: 1, limit: 10 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(list.body.data.some((role: Role) => role.id === createdRoleId)).toBe(
      true,
    );
    expect(list.body.meta).toMatchObject({ currentPage: 1, itemsPerPage: 10 });
    const found = await request(httpServer)
      .get(`/roles/${createdRoleId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(found.body.data.name).toBe(createdRoleName);
    await request(httpServer)
      .get('/roles/999e9999-e99b-99d3-a999-426614174999')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .get('/roles')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(403);
  });

  it('updates roles and validates missing and malformed updates', async () => {
    await request(httpServer)
      .patch(`/roles/${createdRoleId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'estoquista', permissions: [EPermission.LOCATION_READ] })
      .expect(200);
    await request(httpServer)
      .patch('/roles/999e9999-e99b-99d3-a999-426614174999')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'nao-existe' })
      .expect(404);
    await request(httpServer)
      .patch(`/roles/${createdRoleId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ permissions: ['invalid'] })
      .expect(400);
    await request(httpServer)
      .patch(`/roles/${createdRoleId}`)
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'bloqueado' })
      .expect(403);
  });

  it('deletes unused roles, rejects in-use roles and reports missing roles', async () => {
    await request(httpServer)
      .delete(`/roles/${createdRoleId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(204);
    await request(httpServer)
      .delete(`/roles/${createdRoleId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .delete(`/roles/${adminRole.id}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(409);
    await request(httpServer)
      .delete(`/roles/${adminRole.id}`)
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(403);
  });
});
