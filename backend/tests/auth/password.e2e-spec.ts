import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import { Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/modules/users/entities/user.entity';
import {
  cleanTestDatabase,
  MOCK_TENANT_ID,
  setupTestDatabase,
} from '../setup-test-database.helper';

describe('Password management', () => {
  let app: INestApplication;
  let httpServer: Server;
  let dataSource: DataSource;
  let adminCookie: string;

  const userAgent = 'Password-E2E-Agent';

  const parseCookies = (rawCookies: string | string[] | undefined): string => {
    if (!rawCookies) return '';
    const values = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
    return values
      .map((cookie) => cookie.split(';')[0])
      .filter(Boolean)
      .join('; ');
  };

  function login(username: string, password: string) {
    return request(httpServer)
      .post('/auth/')
      .set('x-tenant-slug', 'test-tenant')
      .set('user-agent', userAgent)
      .send({ username, password });
  }

  async function createTargetUser(): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const existing = await userRepository.findOneBy({
      username: 'target.user',
      tenantId: MOCK_TENANT_ID,
    });

    if (!existing) {
      await userRepository.save(
        userRepository.create({
          username: 'target.user',
          password: await bcrypt.hash('InitialPass12', 4),
          tenantId: MOCK_TENANT_ID,
          mustChangePassword: false,
          roles: [],
        }),
      );
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await setupTestDatabase(app);

    dataSource = app.get(DataSource);
    await createTargetUser();
    httpServer = app.getHttpServer() as Server;

    const response = await login('test.user', 'password123').expect(200);
    adminCookie = parseCookies(response.get('Set-Cookie'));
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  it('rejects password changes without an authenticated session', async () => {
    await request(httpServer)
      .patch('/users')
      .send({ password: 'NewPassword12' })
      .expect(401);
  });

  it('changes only the authenticated account and clears mustChangePassword', async () => {
    await request(httpServer)
      .patch('/users')
      .set('Cookie', adminCookie)
      .set('user-agent', userAgent)
      .send({ password: 'OwnPass12345' })
      .expect(200);

    const relogin = await login('test.user', 'OwnPass12345').expect(200);
    const responseBody = relogin.body as { mustChangePassword: boolean };
    expect(responseBody.mustChangePassword).toBe(false);
  });

  it('does not accept a client-selected username in the own-password endpoint', async () => {
    const initialLogin = await login('target.user', 'InitialPass12').expect(
      200,
    );
    const targetCookie = parseCookies(initialLogin.get('Set-Cookie'));

    await request(httpServer)
      .patch('/users')
      .set('Cookie', targetCookie)
      .set('user-agent', userAgent)
      .send({ username: 'test.user', password: 'HackPass123' })
      .expect(400);

    expect((await login('test.user', 'OwnPass12345')).status).toBe(200);
    expect((await login('test.user', 'HackPass123')).status).toBe(401);
  });

  it('does not allow a user without users.update to reset another account', async () => {
    const targetLogin = await login('target.user', 'InitialPass12').expect(200);
    const targetCookie = parseCookies(targetLogin.get('Set-Cookie'));

    await request(httpServer)
      .post('/users/test.user/temporary-password')
      .set('Cookie', targetCookie)
      .set('user-agent', userAgent)
      .expect(403);

    expect((await login('test.user', 'OwnPass12345')).status).toBe(200);
  });

  it('returns not found when resetting a password for an unknown user', async () => {
    await request(httpServer)
      .post('/users/unknown.user/temporary-password')
      .set('Cookie', adminCookie)
      .set('user-agent', userAgent)
      .expect(404);
  });

  it('allows a user with users.update to issue a temporary password and then require first-access change', async () => {
    const resetResponse = await request(httpServer)
      .post('/users/target.user/temporary-password')
      .set('Cookie', adminCookie)
      .set('user-agent', userAgent)
      .expect(200);

    const resetBody = resetResponse.body as {
      data: { temporaryPassword: string };
    };
    const temporaryPassword = resetBody.data.temporaryPassword;
    expect(temporaryPassword).toHaveLength(12);

    const targetLogin = await login('target.user', temporaryPassword).expect(
      200,
    );
    const targetLoginBody = targetLogin.body as { mustChangePassword: boolean };
    expect(targetLoginBody.mustChangePassword).toBe(true);
    const targetCookie = parseCookies(targetLogin.get('Set-Cookie'));

    await request(httpServer)
      .patch('/users')
      .set('Cookie', targetCookie)
      .set('user-agent', userAgent)
      .send({ password: 'Permanent12' })
      .expect(200);

    const permanentLogin = await login('target.user', 'Permanent12').expect(
      200,
    );
    const permanentLoginBody = permanentLogin.body as {
      mustChangePassword: boolean;
    };
    expect(permanentLoginBody.mustChangePassword).toBe(false);
  });
});
