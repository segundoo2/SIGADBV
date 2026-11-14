import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Server } from 'http';
import { AppModule } from '../../src/app.module';
import { EUnitSuccess } from '../../src/common/enum/unit/unit-success.enum';
import { EUnitGender } from '../../src/common/enum/unit/unit-gender.enum';
import { IResponse } from '../../src/common/interfaces/response.interface';
import { UnitEntity } from '../../src/modules/units/entities/unit.entity';
import { UpdateUnitDto } from '../../src/modules/units/dto/update-unit.dto';
import { EPermission } from '../../src/common/enum/role/permissions.enum';
import {
  setupTestDatabase,
  cleanTestDatabase,
} from '../setup-test-database.helper';
import { createE2eUser, E2E_USER_AGENT, loginE2eUser } from '../e2e-helpers';

describe('UnitsModule', () => {
  let app: INestApplication;
  let httpServer: Server;
  let authCookie: string;
  let createdUnitId: string;
  let readOnlyCookie: string;

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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
    await setupTestDatabase(app);

    await createE2eUser(app, 'units.reader', [EPermission.USERS_READ]);

    httpServer = app.getHttpServer() as Server;

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
    readOnlyCookie = await loginE2eUser(
      httpServer,
      'units.reader',
      'Password123',
    );
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  describe('POST /units', () => {
    it('should create a new unit successfully when data is valid', async () => {
      const response = await request(httpServer)
        .post('/units')
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({
          name: 'Gavião-Real',
          gender: EUnitGender.FEMALE,
          maxMembers: 8,
        })
        .expect(201);

      const body = response.body as IResponse<UnitEntity>;

      expect(body).toHaveProperty('message', EUnitSuccess.CREATE);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('id');
      expect(body.data.name).toBe('Gavião-Real');

      createdUnitId = body.data.id;
    });

    it('should return 409 Conflict when unit name already exists for the tenant', async () => {
      await request(httpServer)
        .post('/units')
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({
          name: 'Gavião-Real',
          gender: EUnitGender.FEMALE,
          maxMembers: 8,
        })
        .expect(409);
    });

    it('should reject unauthenticated, unauthorized, and invalid create requests', async () => {
      const payload = {
        name: 'Unidade Extra',
        gender: EUnitGender.MALE,
        maxMembers: 8,
      };
      await request(httpServer).post('/units').send(payload).expect(401);
      await request(httpServer)
        .post('/units')
        .set('Cookie', readOnlyCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send(payload)
        .expect(403);
      await request(httpServer)
        .post('/units')
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({ ...payload, gender: 'INVALID' })
        .expect(400);
    });
  });

  describe('GET /units', () => {
    it('should return a list of units successfully', async () => {
      const response = await request(httpServer)
        .get('/units')
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(200);

      const body = response.body as IResponse<UnitEntity[]>;

      expect(body).toHaveProperty('message', EUnitSuccess.FIND);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should reject unauthenticated and unauthorized list requests', async () => {
      await request(httpServer).get('/units').expect(401);
      await request(httpServer)
        .get('/units')
        .set('Cookie', readOnlyCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(403);
    });
  });

  describe('GET /units/:unitName', () => {
    it('should return a specific unit when name matches', async () => {
      const response = await request(httpServer)
        .get('/units/Gavião-Real')
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(200);

      const body = response.body as IResponse<UnitEntity>;

      expect(body).toHaveProperty('message', EUnitSuccess.FINDONE);
      expect(body.data).toHaveProperty('name', 'Gavião-Real');
    });

    it('should return 404 Not Found when unit does not exist', async () => {
      await request(httpServer)
        .get('/units/Unidade-Inexistente')
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(404);
    });
  });

  describe('PUT /units/:id', () => {
    it('should update the unit successfully', async () => {
      const updateDto: UpdateUnitDto = {
        name: 'Gavião-Atualizado',
        gender: EUnitGender.MALE,
        maxMembers: 6,
      };

      const response = await request(httpServer)
        .put(`/units/${createdUnitId}`)
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send(updateDto)
        .expect(200);

      const body = response.body as IResponse<null>;

      expect(body).toHaveProperty('message', EUnitSuccess.UPDATE);
      expect(body.data).toBeNull();
    });

    it('should reject invalid, missing, and unauthorized unit updates', async () => {
      await request(httpServer)
        .put(`/units/${createdUnitId}`)
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({ gender: 'INVALID' })
        .expect(400);
      await request(httpServer)
        .put('/units/123e4567-e89b-12d3-a456-426614174999')
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({ name: 'Ausente' })
        .expect(404);
      await request(httpServer)
        .put(`/units/${createdUnitId}`)
        .set('Cookie', readOnlyCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({ name: 'Bloqueada' })
        .expect(403);
    });
  });

  describe('DELETE /units/:id', () => {
    it('should delete the unit successfully', async () => {
      const response = await request(httpServer)
        .delete(`/units/${createdUnitId}`)
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(200);

      const body = response.body as IResponse<null>;

      expect(body).toHaveProperty('message', EUnitSuccess.DELETE);
      expect(body.data).toBeNull();
    });

    it('should return 404 Not Found when trying to delete a non-existent unit', async () => {
      await request(httpServer)
        .delete('/units/123e4567-e89b-12d3-a456-426614174999')
        .set('Cookie', authCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(404);
    });

    it('should reject unauthenticated and unauthorized unit deletion', async () => {
      await request(httpServer).delete(`/units/${createdUnitId}`).expect(401);
      await request(httpServer)
        .delete(`/units/${createdUnitId}`)
        .set('Cookie', readOnlyCookie)
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(403);
    });
  });
});
