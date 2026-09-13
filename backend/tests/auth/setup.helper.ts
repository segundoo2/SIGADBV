import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../src/modules/users/entities/user.entity';

export const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000000';
export const MOCK_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export async function setupTestDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);

  await dataSource.synchronize(true);

  const userRepository = dataSource.getRepository(User);
  const plainPassword = 'password123';
  const saltRounds = 4;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  const user = userRepository.create({
    id: MOCK_USER_ID,
    username: 'test.user',
    password: hashedPassword,
    tenantId: MOCK_TENANT_ID,
  });

  await userRepository.save(user);
}

export async function cleanTestDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  if (dataSource.isInitialized) {
    await dataSource.query('TRUNCATE TABLE users CASCADE;');
  }
}
