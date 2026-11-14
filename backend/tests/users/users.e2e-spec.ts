import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Server } from 'http';
import request from 'supertest';
import { User } from '../../src/modules/users/entities/user.entity';
import { Role } from '../../src/modules/roles/entities/role.entity';
import { EPermission } from '../../src/common/enum/role/permissions.enum';
import {
  createE2eApplication,
  createE2eUser,
  E2E_USER_AGENT,
  loginE2eUser,
} from '../e2e-helpers';
import {
  cleanTestDatabase,
  MOCK_TENANT_ID,
} from '../setup-test-database.helper';

describe('Users endpoints (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let dataSource: DataSource;
  let adminCookie: string;
  let readerCookie: string;
  let adminRole: Role;

  beforeAll(async () => {
    app = await createE2eApplication();
    httpServer = app.getHttpServer() as Server;
    dataSource = app.get(DataSource);
    adminCookie = await loginE2eUser(httpServer);
    await createE2eUser(app, 'reader.user', [EPermission.USERS_READ]);
    readerCookie = await loginE2eUser(httpServer, 'reader.user', 'Password123');
    adminRole = await dataSource.getRepository(Role).findOneByOrFail({
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      tenantId: MOCK_TENANT_ID,
    });
    await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        username: 'managed.user',
        password: 'not-used',
        tenantId: MOCK_TENANT_ID,
        mustChangePassword: false,
        roles: [],
      }),
    );
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  it('creates a user with a temporary password and validates duplicate and invalid payloads', async () => {
    const created = await request(httpServer)
      .post('/users')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ username: 'new.user', roleIds: [adminRole.id] })
      .expect(201);
    expect(created.body.data.temporaryPassword).toHaveLength(12);

    await request(httpServer)
      .post('/users')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ username: 'new.user', roleIds: [adminRole.id] })
      .expect(409);
    await request(httpServer)
      .post('/users')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ username: 'Invalid_User', roleIds: [adminRole.id] })
      .expect(400);
    await request(httpServer)
      .post('/users')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        username: 'other.user',
        roleIds: ['999e9999-e99b-99d3-a999-426614174999'],
      })
      .expect(400);
    await request(httpServer)
      .post('/users')
      .set('user-agent', E2E_USER_AGENT)
      .send({ username: 'unauth.user', roleIds: [adminRole.id] })
      .expect(401);
    await request(httpServer)
      .post('/users')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ username: 'forbidden.user', roleIds: [adminRole.id] })
      .expect(403);
  });

  it('finds one user and lists users with pagination, not-found and validation responses', async () => {
    const found = await request(httpServer)
      .get('/users/new.user')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(found.body.data.username).toBe('new.user');
    expect(found.body.data.password).toBeUndefined();
    await request(httpServer)
      .get('/users/missing.user')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);

    const list = await request(httpServer)
      .get('/users')
      .query({ page: 1, limit: 2 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(list.body.data).toHaveLength(2);
    expect(list.body.meta).toMatchObject({ currentPage: 1, itemsPerPage: 2 });
    await request(httpServer)
      .get('/users')
      .query({ page: 0 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(400);
    await request(httpServer)
      .get('/users')
      .set('user-agent', E2E_USER_AGENT)
      .expect(401);
    await request(httpServer)
      .get('/users')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
  });

  it('adds and removes roles, returning conflict and not-found for invalid associations', async () => {
    await request(httpServer)
      .post(`/users/managed.user/roles/${adminRole.id}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    await request(httpServer)
      .post(`/users/managed.user/roles/${adminRole.id}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(409);
    await request(httpServer)
      .post(`/users/missing.user/roles/${adminRole.id}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .post('/users/managed.user/roles/999e9999-e99b-99d3-a999-426614174999')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);

    await request(httpServer)
      .delete(`/users/managed.user/roles/${adminRole.id}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    await request(httpServer)
      .delete(`/users/managed.user/roles/${adminRole.id}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .delete(`/users/missing.user/roles/${adminRole.id}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
  });

  it('deletes users and returns not-found for a second deletion', async () => {
    await request(httpServer)
      .delete('/users/managed.user')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(204);
    await request(httpServer)
      .delete('/users/managed.user')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .delete('/users/new.user')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(403);
  });
});
