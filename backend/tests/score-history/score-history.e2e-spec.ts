import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Server } from 'http';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { ScoreHistoryEntity } from '../../src/modules/score-history/entity/score-history.entity';
import { EScoreHistoryStatus } from '../../src/common/enum/score-story/score-history-status.enum';
import { UnitEntity } from '../../src/modules/units/entities/unit.entity';
import {
  setupTestDatabase,
  cleanTestDatabase,
} from '../setup-test-database.helper';

describe('ScoreHistoryModule', () => {
  let app: INestApplication;
  let httpServer: Server;
  let authCookie: string;
  let dataSource: DataSource;

  const unitId = '123e4567-e89b-12d3-a456-426614174000';

  const parseAllCookies = (
    rawCookies: string | string[] | undefined,
  ): string => {
    if (!rawCookies) return '';
    const cookiesArray = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
    return cookiesArray
      .map((cookie: string) => cookie.split(';')[0])
      .filter((val): val is string => Boolean(val))
      .join('; ');
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();

    // Configura o banco e cria o usuário de teste padrão
    await setupTestDatabase(app);

    // Garante que a unidade de teste existe no banco para satisfazer a FK/regras de negócio
    dataSource = app.get(DataSource);
    await dataSource.query(`
      INSERT INTO units (id, name, tenant_id, score) 
      VALUES ('${unitId}', 'Unidade Teste', '00000000-0000-0000-0000-000000000000', 100)
      ON CONFLICT DO NOTHING;
    `);

    httpServer = app.getHttpServer() as Server;

    // Realiza o login com o usuário padrão gerado pelo setupTestDatabase
    const loginResponse = await request(httpServer)
      .post('/auth/')
      .set('x-tenant-slug', 'dummy-tenant')
      .set('user-agent', 'Supertest-E2E-Agent')
      .send({
        username: 'test.user',
        password: 'password123',
      })
      .expect(200);

    authCookie = parseAllCookies(loginResponse.get('Set-Cookie'));
  });

  async function getUnitScore(): Promise<number> {
    const unit = await dataSource.getRepository(UnitEntity).findOneByOrFail({
      id: unitId,
    });
    return unit.score;
  }

  async function createPendingRequest(
    score: number,
    description: string,
  ): Promise<ScoreHistoryEntity> {
    await request(httpServer)
      .post(`/score-history/${unitId}`)
      .set('Cookie', authCookie)
      .set('user-agent', 'Supertest-E2E-Agent')
      .send({ score, description })
      .expect(201);

    const history = await dataSource
      .getRepository(ScoreHistoryEntity)
      .findOneBy({ unitId, description });

    if (!history) {
      throw new Error(`Score request was not persisted: ${description}`);
    }

    return history;
  }

  async function processScoreRequest(
    id: string,
    action: 'approve' | 'reject',
  ): Promise<request.Response> {
    return await request(httpServer)
      .post(`/score-history/${id}/${action}`)
      .set('Cookie', authCookie)
      .set('user-agent', 'Supertest-E2E-Agent');
  }

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  describe('POST /score-history/:unitId', () => {
    it('should leave the score unchanged while pending and apply a positive score on approval', async () => {
      const scoreBeforeRequest = await getUnitScore();
      const history = await createPendingRequest(
        50,
        'Bônus por participação em evento',
      );

      expect(history.status).toBe(EScoreHistoryStatus.PENDING);
      expect(await getUnitScore()).toBe(scoreBeforeRequest);

      const response = await processScoreRequest(history.id, 'approve');
      expect(response.status).toBe(201);
      expect(await getUnitScore()).toBe(scoreBeforeRequest + 50);
      await expect(
        dataSource.getRepository(ScoreHistoryEntity).findOneByOrFail({
          id: history.id,
          status: EScoreHistoryStatus.APPROVED,
        }),
      ).resolves.toBeDefined();

      expect((await processScoreRequest(history.id, 'approve')).status).toBe(
        400,
      );
      expect((await processScoreRequest(history.id, 'reject')).status).toBe(
        400,
      );
    });

    it('should decrement the score when an approved request has a negative value', async () => {
      const scoreBeforeRequest = await getUnitScore();
      const history = await createPendingRequest(-20, 'Penalização por atraso');

      expect(history.status).toBe(EScoreHistoryStatus.PENDING);
      expect(await getUnitScore()).toBe(scoreBeforeRequest);
      expect((await processScoreRequest(history.id, 'approve')).status).toBe(
        201,
      );
      expect(await getUnitScore()).toBe(scoreBeforeRequest - 20);
    });

    it('should fail with 400 when score is not an integer', async () => {
      const payload = {
        score: 'invalid-score',
        description: 'Teste de falha de tipo',
      };

      await request(httpServer)
        .post(`/score-history/${unitId}`)
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send(payload)
        .expect(400);
    });

    it('should not process a score request that does not exist', async () => {
      await request(httpServer)
        .post('/score-history/999e9999-e99b-99d3-a999-426614174999/approve')
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(404);
    });

    it('should roll back the status when the unit score update fails', async () => {
      const history = await createPendingRequest(
        25,
        'Rollback quando falha pontuação',
      );
      const scoreBeforeApproval = await getUnitScore();

      await dataSource.query(
        'DROP TRIGGER IF EXISTS test_fail_unit_score_update_trigger ON units',
      );
      await dataSource.query(
        'DROP FUNCTION IF EXISTS test_fail_unit_score_update()',
      );
      await dataSource.query(`
        CREATE FUNCTION test_fail_unit_score_update() RETURNS trigger AS $$
        BEGIN
          IF NEW.score IS DISTINCT FROM OLD.score THEN
            RAISE EXCEPTION 'forced unit score update failure';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      await dataSource.query(`
        CREATE TRIGGER test_fail_unit_score_update_trigger
        BEFORE UPDATE OF score ON units
        FOR EACH ROW EXECUTE FUNCTION test_fail_unit_score_update();
      `);

      try {
        expect((await processScoreRequest(history.id, 'approve')).status).toBe(
          500,
        );
      } finally {
        await dataSource.query(
          'DROP TRIGGER IF EXISTS test_fail_unit_score_update_trigger ON units',
        );
        await dataSource.query(
          'DROP FUNCTION IF EXISTS test_fail_unit_score_update()',
        );
      }

      const unchangedHistory = await dataSource
        .getRepository(ScoreHistoryEntity)
        .findOneByOrFail({ id: history.id });
      expect(unchangedHistory.status).toBe(EScoreHistoryStatus.PENDING);
      expect(await getUnitScore()).toBe(scoreBeforeApproval);
    });

    it('should roll back the unit score when the status update fails', async () => {
      const history = await createPendingRequest(
        30,
        'Rollback quando falha status',
      );
      const scoreBeforeApproval = await getUnitScore();

      await dataSource.query(
        'DROP TRIGGER IF EXISTS test_fail_score_history_status_trigger ON score_history',
      );
      await dataSource.query(
        'DROP FUNCTION IF EXISTS test_fail_score_history_status()',
      );
      await dataSource.query(`
        CREATE FUNCTION test_fail_score_history_status() RETURNS trigger AS $$
        BEGIN
          IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'forced score history status update failure';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      await dataSource.query(`
        CREATE TRIGGER test_fail_score_history_status_trigger
        BEFORE UPDATE OF status ON score_history
        FOR EACH ROW EXECUTE FUNCTION test_fail_score_history_status();
      `);

      try {
        expect((await processScoreRequest(history.id, 'approve')).status).toBe(
          500,
        );
      } finally {
        await dataSource.query(
          'DROP TRIGGER IF EXISTS test_fail_score_history_status_trigger ON score_history',
        );
        await dataSource.query(
          'DROP FUNCTION IF EXISTS test_fail_score_history_status()',
        );
      }

      const unchangedHistory = await dataSource
        .getRepository(ScoreHistoryEntity)
        .findOneByOrFail({ id: history.id });
      expect(unchangedHistory.status).toBe(EScoreHistoryStatus.PENDING);
      expect(await getUnitScore()).toBe(scoreBeforeApproval);
    });

    it('should process concurrent approvals only once', async () => {
      const history = await createPendingRequest(40, 'Aprovação concorrente');
      const scoreBeforeApproval = await getUnitScore();

      const responses = await Promise.all([
        processScoreRequest(history.id, 'approve'),
        processScoreRequest(history.id, 'approve'),
      ]);

      expect(responses.map((response) => response.status).sort()).toEqual([
        201, 400,
      ]);
      expect(await getUnitScore()).toBe(scoreBeforeApproval + 40);
      await expect(
        dataSource.getRepository(ScoreHistoryEntity).findOneByOrFail({
          id: history.id,
          status: EScoreHistoryStatus.APPROVED,
        }),
      ).resolves.toBeDefined();
    });

    it('should reject a pending request without changing the score or allowing later processing', async () => {
      const scoreBeforeRejection = await getUnitScore();
      const history = await createPendingRequest(
        -35,
        'Rejeição sem alteração de saldo',
      );

      expect((await processScoreRequest(history.id, 'reject')).status).toBe(
        201,
      );
      expect(await getUnitScore()).toBe(scoreBeforeRejection);

      const rejectedHistory = await dataSource
        .getRepository(ScoreHistoryEntity)
        .findOneByOrFail({ id: history.id });
      expect(rejectedHistory.status).toBe(EScoreHistoryStatus.REJECTED);
      expect((await processScoreRequest(history.id, 'approve')).status).toBe(
        400,
      );
      expect((await processScoreRequest(history.id, 'reject')).status).toBe(
        400,
      );
      expect(await getUnitScore()).toBe(scoreBeforeRejection);
    });
  });

  describe('GET /score-history/:unitId', () => {
    it('should retrieve the score history by unit id successfully', async () => {
      const response = await request(httpServer)
        .get(`/score-history/${unitId}`)
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(200);

      const body = response.body as {
        message: string;
        data: ScoreHistoryEntity[];
      };

      expect(body).toHaveProperty('message');
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0]).toHaveProperty('id');
      expect(body.data[0]).toHaveProperty('score');
      expect(body.data[0]).toHaveProperty('description');
      expect(body.data[0].unitId).toEqual(unitId);
    });

    it('should return 200 with an empty list when the unit has no history', async () => {
      const nonExistentUnitId = '999e9999-e99b-99d3-a999-426614174999';

      const response = await request(httpServer)
        .get(`/score-history/${nonExistentUnitId}`)
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(200);

      const responseBody = response.body as { data: unknown[] };
      expect(responseBody.data).toEqual([]);
    });
  });
});
