import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Server } from 'http';
import { AppModule } from '../src/app.module';
import { setupTestDatabase, cleanTestDatabase } from './auth/setup.helper';

describe('ThrottlerGuard (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;

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

  it('should return 429 Too Many Requests when global rate limit is exceeded', async () => {
    const tenantHeader = 'dummy-tenant';
    const userAgent = 'Supertest-RateLimit-Agent';
    const payload = { username: 'test.user', password: 'wrong-password' };

    let rateLimitHit = false;

    for (let i = 0; i < 12; i++) {
      const res = await request(httpServer)
        .post('/auth/')
        .set('x-tenant-slug', tenantHeader)
        .set('user-agent', userAgent)
        .send(payload);

      if (res.status === 429) {
        rateLimitHit = true;
        break;
      }
    }

    expect(rateLimitHit).toBe(true);
  });
});
