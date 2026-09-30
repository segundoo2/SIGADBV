import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Server } from 'http';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { ScoreHistoryEntity } from '../../src/modules/score-history/entity/score-history.entity';
import {
  setupTestDatabase,
  cleanTestDatabase,
} from '../setup-test-database.helper';

describe('ScoreHistoryModule', () => {
  let app: INestApplication;
  let httpServer: Server;
  let authCookie: string;

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
    const dataSource = app.get(DataSource);
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

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  describe('POST /score-history/:unitId', () => {
    it('should adjust unit score successfully with a positive value and save history', async () => {
      const payload = {
        score: 50,
        description: 'Bônus por participação em evento',
      };

      const response = await request(httpServer)
        .post(`/score-history/${unitId}`)
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send(payload)
        .expect(201);

      const body = response.body as {
        message: string;
        data: { newScore: number };
      };

      expect(body).toHaveProperty('message');
      expect(body.data).toHaveProperty('newScore');
    });

    it('should adjust unit score successfully with a negative value (penalty)', async () => {
      const payload = {
        score: -20,
        description: 'Penalização por atraso',
      };

      const response = await request(httpServer)
        .post(`/score-history/${unitId}`)
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send(payload)
        .expect(201);

      const body = response.body as {
        message: string;
        data: { newScore: number };
      };

      expect(body).toHaveProperty('message');
      expect(body.data).toHaveProperty('newScore');
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
        data: ScoreHistoryEntity;
      };

      expect(body).toHaveProperty('message');
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('score');
      expect(body.data).toHaveProperty('description');
      expect(body.data.unitId).toEqual(unitId);
    });

    it('should return 404 when history does not exist for the unit', async () => {
      const nonExistentUnitId = '999e9999-e99b-99d3-a999-426614174999';

      await request(httpServer)
        .get(`/score-history/${nonExistentUnitId}`)
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(404);
    });
  });
});
