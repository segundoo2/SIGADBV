import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { EPermission } from '../../src/common/enum/role/permissions.enum';
import { EScoreHistoryStatus } from '../../src/common/enum/score-story/score-history-status.enum';
import { ScoreHistoryEntity } from '../../src/modules/score-history/entity/score-history.entity';
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

describe('Score history query endpoints (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let dataSource: DataSource;
  let adminCookie: string;
  let readerCookie: string;
  const unitId = '123e4567-e89b-12d3-a456-426614174000';

  beforeAll(async () => {
    app = await createE2eApplication();
    httpServer = app.getHttpServer() as Server;
    dataSource = app.get(DataSource);
    adminCookie = await loginE2eUser(httpServer);
    await createE2eUser(app, 'score.reader', [EPermission.SCORE_HISTORY_READ]);
    readerCookie = await loginE2eUser(
      httpServer,
      'score.reader',
      'Password123',
    );
    await dataSource.query(
      `INSERT INTO units (id, name, tenant_id, score) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [unitId, 'Unidade consultas E2E', MOCK_TENANT_ID, 100],
    );
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  it('returns the pending score queue, then returns not-found after processing it', async () => {
    await request(httpServer)
      .post(`/score-history/${unitId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ score: 5, description: 'Fila de revisão E2E' })
      .expect(201);
    const queue = await request(httpServer)
      .get('/score-history/pending')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    const pending = queue.body.data.find(
      (record: ScoreHistoryEntity) =>
        record.description === 'Fila de revisão E2E',
    );
    expect(pending).toBeDefined();
    expect(pending.status).toBe(EScoreHistoryStatus.PENDING);

    await request(httpServer)
      .post(`/score-history/${pending.id}/approve`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(201);
    await request(httpServer)
      .get('/score-history/pending')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
  });

  it('returns unit selector options and score history with an optional limit', async () => {
    const options = await request(httpServer)
      .get('/score-history/units/units-options')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(options.body.data).toContainEqual({
      id: unitId,
      name: 'Unidade consultas E2E',
    });

    const history = await request(httpServer)
      .get(`/score-history/${unitId}`)
      .query({ limit: 1 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0].unitId).toBe(unitId);
    await request(httpServer)
      .get('/score-history/units/units-options')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(403);
    await request(httpServer)
      .get(`/score-history/${unitId}`)
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
  });

  it('rejects unauthenticated access to approval-only score endpoints', async () => {
    await request(httpServer).get('/score-history/pending').expect(401);
    await request(httpServer).get(`/score-history/${unitId}`).expect(401);
    await request(httpServer)
      .get('/score-history/units/units-options')
      .expect(401);
  });
});
