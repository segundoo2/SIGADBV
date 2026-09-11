import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [{ provide: 'ICacheStorageService', useClass: RedisService }],
  exports: ['ICacheStorageService'],
})
export class RedisModule {}
