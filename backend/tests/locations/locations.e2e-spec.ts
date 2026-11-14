import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { EPermission } from '../../src/common/enum/role/permissions.enum';
import { ELocationType } from '../../src/modules/locations/entities/location.entity';
import {
  createE2eApplication,
  createE2eUser,
  E2E_USER_AGENT,
  loginE2eUser,
} from '../e2e-helpers';
import { cleanTestDatabase } from '../setup-test-database.helper';

describe('Locations endpoints (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let adminCookie: string;
  let readerCookie: string;
  const code = 'E2E-STORAGE-A1';

  beforeAll(async () => {
    app = await createE2eApplication();
    httpServer = app.getHttpServer() as Server;
    adminCookie = await loginE2eUser(httpServer);
    await createE2eUser(app, 'location.reader', [EPermission.USERS_READ]);
    readerCookie = await loginE2eUser(
      httpServer,
      'location.reader',
      'Password123',
    );
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  it('creates storage and display locations and validates duplicate and display capacity requirements', async () => {
    await request(httpServer)
      .post('/locations')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        code,
        type: ELocationType.STORAGE,
        description: 'Posição de teste',
      })
      .expect(201);
    await request(httpServer)
      .post('/locations')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ code, type: ELocationType.STORAGE })
      .expect(409);
    await request(httpServer)
      .post('/locations')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ code: 'E2E-DISPLAY-NO-CAP', type: ELocationType.DISPLAY })
      .expect(400);
    await request(httpServer)
      .post('/locations')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ code: 'E2E-DISPLAY', type: ELocationType.DISPLAY, capacity: 8 })
      .expect(201);
    await request(httpServer)
      .post('/locations')
      .set('user-agent', E2E_USER_AGENT)
      .send({ code: 'NO-AUTH' })
      .expect(401);
    await request(httpServer)
      .post('/locations')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ code: 'FORBIDDEN' })
      .expect(403);
  });

  it('finds and lists locations and validates pagination and missing results', async () => {
    const found = await request(httpServer)
      .get(`/locations/${code}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(found.body.data).toMatchObject({
      code,
      type: ELocationType.STORAGE,
    });
    const list = await request(httpServer)
      .get('/locations')
      .query({ page: 1, limit: 5 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(2);
    expect(list.body.meta).toMatchObject({ currentPage: 1, itemsPerPage: 5 });
    await request(httpServer)
      .get('/locations/UNKNOWN-CODE')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .get('/locations')
      .query({ limit: 101 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(400);
    await request(httpServer)
      .get('/locations')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(403);
  });

  it('updates location properties and validates missing locations and display capacity', async () => {
    await request(httpServer)
      .patch(`/locations/${code}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ description: 'Atualizada' })
      .expect(200);
    await request(httpServer)
      .patch(`/locations/${code}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ type: ELocationType.DISPLAY, capacity: null })
      .expect(400);
    await request(httpServer)
      .patch('/locations/NOT-FOUND')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ description: 'Ausente' })
      .expect(404);
    await request(httpServer)
      .patch(`/locations/${code}`)
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ description: 'Bloqueada' })
      .expect(403);
  });

  it('deletes locations and returns not-found for missing codes', async () => {
    await request(httpServer)
      .delete(`/locations/${code}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    await request(httpServer)
      .delete(`/locations/${code}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .delete('/locations/E2E-DISPLAY')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
  });
});
