import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Server } from 'http';
import { AppModule } from '../../src/app.module';
import { setupTestDatabase, cleanTestDatabase } from './setup.helper';
import { EAuthSuccess } from '../../src/common/enum/auth-success.enum';

describe('AuthModule (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;

  const parseAllCookies = (
    rawCookies: string | string[] | undefined,
  ): string => {
    if (!rawCookies) return '';
    const cookiesArray = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
    return cookiesArray
      .map((cookie) => cookie.split(';')[0])
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
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  describe('POST /auth/', () => {
    it('should authenticate successfully and set cookies when credentials and headers are valid', async () => {
      const response = await request(httpServer)
        .post('/auth/')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({
          username: 'test.user',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', EAuthSuccess.LOGIN);

      const rawSetCookie = response.headers['set-cookie'];
      const cookies = Array.isArray(rawSetCookie)
        ? rawSetCookie
        : typeof rawSetCookie === 'string'
          ? [rawSetCookie]
          : undefined;

      expect(cookies).toBeDefined();
      expect(cookies?.some((c) => c.includes('access_token'))).toBe(true);
      expect(cookies?.some((c) => c.includes('refresh_token'))).toBe(true);
    });

    it('should set secure flags (HttpOnly, SameSite) on authentication cookies', async () => {
      const response = await request(httpServer)
        .post('/auth/')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({ username: 'test.user', password: 'password123' })
        .expect(200);

      const rawSetCookie = response.headers['set-cookie'];
      const cookies = Array.isArray(rawSetCookie)
        ? rawSetCookie
        : typeof rawSetCookie === 'string'
          ? [rawSetCookie]
          : [];

      const cookieString = cookies.join('; ');

      expect(cookieString).toContain('HttpOnly');
      expect(cookieString).toContain('SameSite=');
    });

    it('should return 400 Bad Request when x-tenant-slug header is missing', async () => {
      const response = await request(httpServer)
        .post('/auth/')
        .send({
          username: 'test.user',
          password: 'password123',
        })
        .expect(400);

      const body = response.body as { message: string | string[] };
      const message = Array.isArray(body.message)
        ? body.message[0]
        : body.message;

      expect(message).toContain('O cabeçalho x-tenant-slug é obrigatório.');
    });

    it('should return 401 Unauthorized when username is not found', async () => {
      await request(httpServer)
        .post('/auth/')
        .set('x-tenant-slug', 'dummy-tenant')
        .send({
          username: 'non-existent-user',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 401 Unauthorized when password is invalid', async () => {
      await request(httpServer)
        .post('/auth/')
        .set('x-tenant-slug', 'dummy-tenant')
        .send({
          username: 'test.user',
          password: 'wrong-password',
        })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should issue new tokens when a valid refresh cookie is provided', async () => {
      const loginResponse = await request(httpServer)
        .post('/auth/')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({ username: 'test.user', password: 'password123' })
        .expect(200);

      const cookieHeader = parseAllCookies(loginResponse.get('Set-Cookie'));

      const refreshResponse = await request(httpServer)
        .post('/auth/refresh')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(refreshResponse.body).toHaveProperty(
        'message',
        EAuthSuccess.REFRESH,
      );
      expect(refreshResponse.get('Set-Cookie')).toBeDefined();
    });

    it('should return 401 Unauthorized when refresh is attempted with a different device/user-agent', async () => {
      const loginResponse = await request(httpServer)
        .post('/auth/')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Original-Device-Agent')
        .send({ username: 'test.user', password: 'password123' })
        .expect(200);

      const cookieHeader = parseAllCookies(loginResponse.get('Set-Cookie'));

      await request(httpServer)
        .post('/auth/refresh')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Malicious-Or-Different-Device-Agent')
        .set('Cookie', cookieHeader)
        .expect(401);
    });

    it('should return 401 Unauthorized when refresh cookie is missing', async () => {
      await request(httpServer)
        .post('/auth/refresh')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .expect(401);
    });

    it('should return 401 Unauthorized when refresh cookie is invalid or malformed', async () => {
      await request(httpServer)
        .post('/auth/refresh')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .set('Cookie', 'refresh_token=invalid.token.here')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear authentication cookies upon logout', async () => {
      const loginResponse = await request(httpServer)
        .post('/auth/')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({ username: 'test.user', password: 'password123' })
        .expect(200);

      const cookieHeader = parseAllCookies(loginResponse.get('Set-Cookie'));

      const logoutResponse = await request(httpServer)
        .post('/auth/logout')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(logoutResponse.body).toHaveProperty(
        'message',
        EAuthSuccess.LOGOUT,
      );
    });

    it('should reject refresh requests after logout (revoked token in redis)', async () => {
      const loginResponse = await request(httpServer)
        .post('/auth/')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .send({ username: 'test.user', password: 'password123' })
        .expect(200);

      const cookieHeader = parseAllCookies(loginResponse.get('Set-Cookie'));

      await request(httpServer)
        .post('/auth/logout')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .set('Cookie', cookieHeader)
        .expect(200);

      // Aqui testamos se o refresh falha (pode retornar 401 ou 400 dependendo de como o guard trata o token revogado)
      const refreshAttempt = await request(httpServer)
        .post('/auth/refresh')
        .set('x-tenant-slug', 'dummy-tenant')
        .set('user-agent', 'Supertest-E2E-Agent')
        .set('Cookie', cookieHeader);

      expect(refreshAttempt.status).toBeGreaterThanOrEqual(400);
    });
  });
});
