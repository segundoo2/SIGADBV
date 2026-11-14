import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Server } from 'http';
import request from 'supertest';
import { EPermission } from '../../src/common/enum/role/permissions.enum';
import {
  Location,
  ELocationType,
} from '../../src/modules/locations/entities/location.entity';
import { Product } from '../../src/modules/products/entities/product.entity';
import { ProductLocation } from '../../src/modules/locations/entities/product-location.entity';
import { EMovementType } from '../../src/modules/movements/dtos/movement.dto';
import {
  createE2eApplication,
  createE2eUser,
  createTestProduct,
  E2E_USER_AGENT,
  loginE2eUser,
} from '../e2e-helpers';
import { cleanTestDatabase } from '../setup-test-database.helper';

describe('Movements endpoints (E2E)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let adminCookie: string;
  let readerCookie: string;
  let productId: string;
  let storageId: string;
  let displayId: string;

  beforeAll(async () => {
    app = await createE2eApplication();
    httpServer = app.getHttpServer() as Server;
    adminCookie = await loginE2eUser(httpServer);
    await createE2eUser(app, 'movement.reader', [EPermission.USERS_READ]);
    readerCookie = await loginE2eUser(
      httpServer,
      'movement.reader',
      'Password123',
    );
    await request(httpServer)
      .post('/products')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send(createTestProduct('E2E-MOVEMENT-001'))
      .expect(201);
    productId = (
      await app
        .get(DataSource)
        .getRepository(Product)
        .findOneByOrFail({ sku: 'E2E-MOVEMENT-001' })
    ).id;
    const locationRepository = app.get(DataSource).getRepository(Location);
    storageId = (
      await locationRepository.save(
        locationRepository.create({
          code: 'E2E-MOVE-STORAGE',
          type: ELocationType.STORAGE,
          tenantId: '00000000-0000-0000-0000-000000000000',
        }),
      )
    ).id;
    displayId = (
      await locationRepository.save(
        locationRepository.create({
          code: 'E2E-MOVE-DISPLAY',
          type: ELocationType.DISPLAY,
          capacity: 8,
          tenantId: '00000000-0000-0000-0000-000000000000',
        }),
      )
    ).id;
  });

  afterAll(async () => {
    await cleanTestDatabase(app);
    await app.close();
  });

  it('registers stock input and output atomically and rejects invalid or insufficient movements', async () => {
    await request(httpServer)
      .post('/movements')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        productId,
        typeMovement: EMovementType.IN,
        quantity: 20,
        reason: 'Entrada E2E',
      })
      .expect(201);
    await request(httpServer)
      .post('/movements')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        productId,
        typeMovement: EMovementType.OUT,
        quantity: 3,
        reason: 'Saída E2E',
      })
      .expect(201);
    let product = await app
      .get(DataSource)
      .getRepository(Product)
      .findOneByOrFail({ id: productId });
    expect(product.currentStock).toBe(17);
    await request(httpServer)
      .post('/movements')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ productId, typeMovement: EMovementType.OUT, quantity: 99 })
      .expect(400);
    await request(httpServer)
      .post('/movements')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ productId, typeMovement: 'INVALID', quantity: 1 })
      .expect(400);
    await request(httpServer)
      .post('/movements')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        productId: '999e9999-e99b-49d3-a999-426614174999',
        typeMovement: EMovementType.IN,
        quantity: 1,
      })
      .expect(404);
    await request(httpServer)
      .post('/movements')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ productId, typeMovement: EMovementType.IN, quantity: 1 })
      .expect(403);
    await request(httpServer)
      .post('/movements')
      .set('user-agent', E2E_USER_AGENT)
      .send({ productId, typeMovement: EMovementType.IN, quantity: 1 })
      .expect(401);
    product = await app
      .get(DataSource)
      .getRepository(Product)
      .findOneByOrFail({ id: productId });
    expect(product.currentStock).toBe(17);
  });

  it('allocates general stock and transfers allocated stock between physical locations', async () => {
    await request(httpServer)
      .post('/movements/allocate-location')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ productId, targetLocationId: storageId, quantity: 10 })
      .expect(201);
    await request(httpServer)
      .post('/movements/allocate-location')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        productId,
        sourceLocationId: storageId,
        targetLocationId: displayId,
        quantity: 4,
      })
      .expect(201);

    const allocations = await app
      .get(DataSource)
      .getRepository(ProductLocation)
      .find({ where: { productId } });
    expect(
      allocations.find((item) => item.locationId === storageId)?.quantity,
    ).toBe(6);
    expect(
      allocations.find((item) => item.locationId === displayId)?.quantity,
    ).toBe(4);
    const product = await app
      .get(DataSource)
      .getRepository(Product)
      .findOneByOrFail({ id: productId });
    expect(product.currentStock).toBe(17);
    await request(httpServer)
      .post('/movements/allocate-location')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ productId, targetLocationId: displayId, quantity: 5 })
      .expect(400);
    await request(httpServer)
      .post('/movements/allocate-location')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        productId,
        sourceLocationId: storageId,
        targetLocationId: displayId,
        quantity: 99,
      })
      .expect(400);
    await request(httpServer)
      .post('/movements/allocate-location')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        productId,
        sourceLocationId: storageId,
        targetLocationId: storageId,
        quantity: 1,
      })
      .expect(400);
    await request(httpServer)
      .post('/movements/allocate-location')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({
        productId,
        targetLocationId: '999e9999-e99b-49d3-a999-426614174999',
        quantity: 1,
      })
      .expect(404);
    await request(httpServer)
      .post('/movements/allocate-location')
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .send({ productId, targetLocationId: displayId, quantity: 1 })
      .expect(403);
  });

  it('lists product movements with pagination and rejects invalid or unknown products', async () => {
    const response = await request(httpServer)
      .get(`/movements/product/${productId}`)
      .query({ page: 1, limit: 3 })
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(200);
    expect(response.body.data.length).toBe(3);
    expect(response.body.meta).toMatchObject({
      currentPage: 1,
      itemsPerPage: 3,
    });
    await request(httpServer)
      .get('/movements/product/not-a-uuid')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(400);
    await request(httpServer)
      .get('/movements/product/999e9999-e99b-99d3-a999-426614174999')
      .set('Cookie', adminCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(404);
    await request(httpServer)
      .get(`/movements/product/${productId}`)
      .set('Cookie', readerCookie)
      .set('user-agent', E2E_USER_AGENT)
      .expect(403);
  });
});
