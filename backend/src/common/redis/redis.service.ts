import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { ICacheStorageService } from './interface/cache-storage.interface';

@Injectable()
export class RedisService
  implements ICacheStorageService, OnModuleInit, OnModuleDestroy
{
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
    await this.client.set(key, value, {
      EX: ttlSeconds,
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}
