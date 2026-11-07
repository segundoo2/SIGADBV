import path from 'path';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        }
      : false,
  extra: { enableChannelBinding: process.env.DB_CHANNEL_BINDING === 'true' },
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [
    path.join(__dirname, '../migration/*{.ts,.js}'),
    path.join(__dirname, './migrations/*{.ts,.js}'),
  ],
  synchronize: false,
  logging: true,
});
