import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { ICacheStorageService } from './interface/cache-storage.interface';

@Injectable()
export class RedisService
  implements ICacheStorageService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;

  constructor() {
    const redisUrl: string = process.env.REDIS_URL ?? 'redis://localhost:6379';
    const isTls: boolean = redisUrl.startsWith('rediss://');

    this.client = createClient({
      url: redisUrl,
      ...(isTls && {
        socket: {
          tls: true,
        },
      }),
    });

    this.setupLogging();
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  async setWithExpiry(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    this.logCommand('SETEX', key, `ttl:${ttlSeconds}s`);
    await this.client.set(key, value, {
      EX: ttlSeconds,
    });
  }

  async get(key: string): Promise<string | null> {
    this.logCommand('GET', key);
    return await this.client.get(key);
  }

  async delete(key: string): Promise<void> {
    this.logCommand('DEL', key);
    await this.client.del(key);
  }

  private setupLogging(): void {
    this.client.on('connect', () => {
      this.logger.log('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client successfully connected and ready.');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis client error: ${err.message}`, err.stack);
    });

    this.client.on('end', () => {
      this.logger.warn('Redis connection closed.');
    });
  }

  private logCommand(command: string, key: string, extra = ''): void {
    if (process.env.NODE_ENV !== 'production') {
      const extraInfo = extra ? ` [${extra}]` : '';
      this.logger.debug(`[Command] ${command} -> Key: "${key}"${extraInfo}`);
    }
  }
}
