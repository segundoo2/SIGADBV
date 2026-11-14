import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Server } from 'http';
import request from 'supertest';
import { EPermission } from '../../src/common/enum/role/permissions.enum';
import { Category } from '../../src/modules/categories/entities/category.entity';
import {
  createE2eApplication,
  createE2eUser,
  E2E_USER_AGENT,
  loginE2eUser,
} from '../e2e-helpers';
import { cleanTestDatabase } from '../setup-test-database.helper';

describe('Categories endpoints (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let adminCookie: string;
  let readerCookie: string;
  let categoryId: string;

  beforeAll(async () => {
    app = await createE2eApplication();
    httpServer = app.getHttpServer() as Server;
    adminCookie = await loginE2eUser(httpServer);
    await createE2eUser(app, 'category.reader', [EPermission.USERS_READ]);
    readerCookie = await loginE2eUser(
      httpServer,
      'category.reader',
      'Password123',
    );
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  it('creates categories and rejects duplicate or invalid payloads', async () => {
    await request(httpServer)
      .post('/categories')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        name: 'E2E Categoria',
        description: 'Categoria de teste',
        isActive: true,
      })
      .expect(201);
    categoryId = (
      await app
        .get(DataSource)
        .getRepository(Category)
        .findOneByOrFail({ name: 'E2E Categoria' })
    ).id;
    await request(httpServer)
      .post('/categories')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'E2E Categoria', isActive: true })
      .expect(409);
    await request(httpServer)
      .post('/categories')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'x', isActive: 'true' })
      .expect(400);
    await request(httpServer)
      .post('/categories')
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'Sem auth', isActive: true })
      .expect(401);
    await request(httpServer)
      .post('/categories')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'Sem permissão', isActive: true })
      .expect(403);
  });

  it('finds and lists categories and reports empty or missing results', async () => {
    const found = await request(httpServer)
      .get('/categories/E2E Categoria')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(found.body.data).toMatchObject({
      id: categoryId,
      name: 'E2E Categoria',
    });
    const list = await request(httpServer)
      .get('/categories')
      .query({ page: 1, limit: 5 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(
      list.body.data.some((item: Category) => item.id === categoryId),
    ).toBe(true);
    expect(list.body.meta).toMatchObject({ currentPage: 1, itemsPerPage: 5 });
    await request(httpServer)
      .get('/categories/Inexistente')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .get('/categories')
      .query({ page: 0 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(400);
    await request(httpServer)
      .get('/categories')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(403);
  });

  it('updates and deletes a category with missing-record and permission checks', async () => {
    await request(httpServer)
      .patch(`/categories/${categoryId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'Categoria alterada' })
      .expect(200);
    await request(httpServer)
      .patch('/categories/999e9999-e99b-99d3-a999-426614174999')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'Ausente' })
      .expect(404);
    await request(httpServer)
      .patch(`/categories/${categoryId}`)
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'Bloqueado' })
      .expect(403);
    await request(httpServer)
      .delete(`/categories/${categoryId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    await request(httpServer)
      .delete(`/categories/${categoryId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .get('/categories')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
  });
});
