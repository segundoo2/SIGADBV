import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuthRepository } from './auth.repository';
import { JwtModule } from '@nestjs/jwt';
import { JwtAdapter } from '../../common/adapters/jwt.adapter';
import { RedisModule } from '../../common/redis/redis.module';
import { RedisService } from '../../common/redis/redis.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { JwtRefreshStrategy } from '../../common/strategies/refresh-token.strategy';

@Module({
  imports: [
    RedisModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
    JwtRefreshGuard,
    { provide: 'ICacheStorageService', useClass: RedisService },
    { provide: 'IAuthService', useClass: AuthService },
    { provide: 'IAuthRepository', useClass: AuthRepository },
    { provide: 'ITokenService', useClass: JwtAdapter },
  ],
})
export class AuthModule {}
