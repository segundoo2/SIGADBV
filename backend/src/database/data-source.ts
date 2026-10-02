import path from 'path';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.join(__dirname, 'src/**/*.entity.ts')],
  migrations: [path.join(__dirname, 'src/database/migrations/*.ts')],
  synchronize: false,
  logging: true,
});
