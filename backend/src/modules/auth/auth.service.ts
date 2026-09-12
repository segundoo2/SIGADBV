import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { EAuthSuccess } from '../../common/enum/auth-success.enum';
import { EPermission } from '../../common/enum/permissions.enum';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dtos/login.dto';
import type { IAuthRepository } from './interfaces/auth.repository.interface';
import {
  IJwtPayloadWithExpiry,
  IJwtPayload,
} from './interfaces/jwt-payload.interface';
import type {
  ITokenService,
  TokenDuration,
} from './interfaces/jwt-service.interface';
import * as bcrypt from 'bcrypt';
import { EErrorsGlobal } from '../../common/enum/errors-global.enum';
import type { ICacheStorageService } from '../../common/redis/interface/cache-storage.interface';
import { EAuthErrors } from '../../common/enum/auth-errors.enum';

type PermissionItem = EPermission | { slug: EPermission };

@Injectable()
export class AuthService {
  constructor(
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    @Inject('ICacheStorageService')
    private readonly redisService: ICacheStorageService,
  ) {}

  async login(loginDto: LoginDto, fingerprint: string) {
    const tenantId = '00000000-0000-0000-0000-000000000000'; //implementar lógica de busca do tenantId pelo slug

    const user = await this.authRepository.findUserByUsername(
      loginDto.username,
      tenantId,
    );

    if (!user) {
      throw new UnauthorizedException(EAuthErrors.USER_NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(EAuthErrors.USER_NOT_FOUND);
    }

    const payload = this.buildJwtPayload(user, fingerprint);

    const accessTokenExpiresIn = (process.env.ACCESS_TOKEN_EXPIRES_IN ||
      '15m') as TokenDuration;
    const refreshTokenExpiresIn = (process.env.REFRESH_TOKEN_EXPIRES_IN ||
      '7d') as TokenDuration;

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAsync(payload, {
        secret: process.env.JWT_SECRET as string,
        expiresIn: accessTokenExpiresIn,
      }),
      this.tokenService.signAsync(payload, {
        secret: process.env.JWT_SECRET as string,
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    return {
      message: EAuthSuccess.LOGIN,
      data: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(payload: IJwtPayloadWithExpiry, newFingerprint: string) {
    const user = await this.authRepository.findUserByUsername(
      payload.username,
      payload.tenantId,
    );

    if (!user) {
      throw new UnauthorizedException(EErrorsGlobal.FAILED_RETRIEVE_SESSION);
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const ttl = payload.exp - nowInSeconds;

    if (ttl > 0) {
      await this.redisService.setWithExpiry(
        `blacklist:refresh:${payload.sub}:${payload.exp}`,
        'rotated',
        ttl,
      );
    }

    const newPayload = this.buildJwtPayload(user, newFingerprint);

    const accessTokenExpiresIn = (process.env.ACCESS_TOKEN_EXPIRES_IN ||
      '15m') as TokenDuration;
    const refreshTokenExpiresIn = (process.env.REFRESH_TOKEN_EXPIRES_IN ||
      '7d') as TokenDuration;

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAsync(newPayload, {
        secret: process.env.JWT_SECRET as string,
        expiresIn: accessTokenExpiresIn,
      }),
      this.tokenService.signAsync(newPayload, {
        secret: process.env.JWT_SECRET as string,
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    return {
      message: EAuthSuccess.REFRESH,
      data: {
        accessToken,
        refreshToken,
      },
    };
  }

  async logout(payload: IJwtPayloadWithExpiry) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const ttl = payload.exp - nowInSeconds;

    if (ttl > 0) {
      await this.redisService.setWithExpiry(
        `blacklist:refresh:${payload.sub}:${payload.exp}`,
        'revoked',
        ttl,
      );
    }

    return {
      message: EAuthSuccess.LOGOUT,
    };
  }

  private buildJwtPayload(user: User, fingerprint: string): IJwtPayload {
    const roles = user.roles?.map((role) => role.name) ?? [];

    const rawPermissions =
      user.roles?.flatMap(
        (role) => role.permissions as unknown as PermissionItem[],
      ) ?? [];

    const permissions = rawPermissions.map((permission) =>
      typeof permission === 'string' ? permission : permission.slug,
    );

    return {
      sub: user.id,
      tenantId: user.tenantId,
      username: user.username,
      roles,
      permissions: Array.from(new Set(permissions)),
      fingerprint,
    };
  }
}
