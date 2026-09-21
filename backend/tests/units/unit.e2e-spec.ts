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
import { setupTestDatabase, cleanTestDatabase } from '../auth/setup.helper';

describe('UnitsModule (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let authCookie: string;
  let createdUnitId: string;

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
  });
});
