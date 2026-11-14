import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Server } from 'http';
import request from 'supertest';
import { EPermission } from '../../src/common/enum/role/permissions.enum';
import { Product } from '../../src/modules/products/entities/product.entity';
import {
  createE2eApplication,
  createE2eUser,
  createTestProduct,
  E2E_USER_AGENT,
  loginE2eUser,
} from '../e2e-helpers';
import { cleanTestDatabase } from '../setup-test-database.helper';

describe('Products endpoints (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let adminCookie: string;
  let readerCookie: string;
  let productId: string;
  const sku = 'E2E-PRODUCT-001';

  beforeAll(async () => {
    app = await createE2eApplication();
    httpServer = app.getHttpServer() as Server;
    adminCookie = await loginE2eUser(httpServer);
    await createE2eUser(app, 'product.reader', [EPermission.USERS_READ]);
    readerCookie = await loginE2eUser(
      httpServer,
      'product.reader',
      'Password123',
    );
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  it('creates products and rejects duplicates and invalid data', async () => {
    await request(httpServer)
      .post('/products')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send(createTestProduct(sku))
      .expect(201);
    const product = await app
      .get(DataSource)
      .getRepository(Product)
      .findOneByOrFail({ sku });
    productId = product.id;
    await request(httpServer)
      .post('/products')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send(createTestProduct(sku))
      .expect(409);
    await request(httpServer)
      .post('/products')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ ...createTestProduct('BAD'), price: -1 })
      .expect(400);
    await request(httpServer)
      .post('/products')
      .set('user-agent', E2E_USER_AGENT)
      .send(createTestProduct('NO-AUTH'))
      .expect(401);
    await request(httpServer)
      .post('/products')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send(createTestProduct('FORBIDDEN'))
      .expect(403);
  });

  it('gets a product by SKU and lists products with pagination', async () => {
    const found = await request(httpServer)
      .get(`/products/${sku}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(found.body.data).toMatchObject({ id: productId, sku });
    const list = await request(httpServer)
      .get('/products')
      .query({ page: 1, limit: 5 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(list.body.data.some((item: Product) => item.id === productId)).toBe(
      true,
    );
    expect(list.body.meta).toMatchObject({ currentPage: 1, itemsPerPage: 5 });
    await request(httpServer)
      .get('/products/UNKNOWN-SKU')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .get('/products')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(403);
  });

  it('updates a product and validates UUID and not-found cases', async () => {
    await request(httpServer)
      .patch(`/products/${productId}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'Produto atualizado' })
      .expect(200);
    await request(httpServer)
      .patch('/products/not-a-uuid')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'Inválido' })
      .expect(400);
    await request(httpServer)
      .patch('/products/999e9999-e99b-99d3-a999-426614174999')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'Ausente' })
      .expect(404);
    await request(httpServer)
      .patch(`/products/${productId}`)
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ name: 'Bloqueado' })
      .expect(403);
  });

  it('deletes a product by SKU and returns not-found after deletion', async () => {
    await request(httpServer)
      .delete(`/products/${sku}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    await request(httpServer)
      .delete(`/products/${sku}`)
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .get('/products')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
  });
});
