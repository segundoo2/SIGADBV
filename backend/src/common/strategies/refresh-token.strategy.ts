import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { IJwtPayloadWithExpiry } from '../../modules/auth/interfaces/jwt-payload.interface';
import { RequestWithCookies } from './interfaces/req-with-cookies.interface';
import { EErrorsGlobal } from '../enum/global/errors-global.enum';
import type { ICacheStorageService } from '../redis/interface/cache-storage.interface';
import { ConfigService } from '@nestjs/config';
import { getRefreshTokenBlacklistKey } from '../../modules/auth/utils/refresh-token-blacklist-key';

export const cookieRefreshExtractor = (
  req: RequestWithCookies,
): string | null => {
  const strictReq = req;
  if (strictReq && strictReq.cookies) {
    const token = strictReq.cookies['refresh_token'];
    if (token) return token;
  }
  return null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject('ICacheStorageService')
    private readonly redisService: ICacheStorageService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: cookieRefreshExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: RequestWithCookies,
    payload: IJwtPayloadWithExpiry,
  ): Promise<IJwtPayloadWithExpiry> {
    if (!payload) {
      throw new UnauthorizedException(EErrorsGlobal.FAILED_RETRIEVE_SESSION);
    }

    // 1. Validação cruzada do Fingerprint
    const currentFingerprint =
      req.headers['x-device-id'] || req.headers['user-agent'] || 'unknown';

    if (payload.fingerprint !== currentFingerprint) {
      throw new UnauthorizedException('Dispositivo divergente. Acesso negado.');
    }

    // 2. Validação na Blacklist do Redis
    const blacklistKey = getRefreshTokenBlacklistKey(payload);
    const status = await this.redisService.get(blacklistKey);

    if (status) {
      if (status === 'rotated') {
        throw new UnauthorizedException(
          'Tentativa de reuso de token detectada. Faça login novamente.',
        );
      }
      throw new UnauthorizedException('Sessão encerrada ou token inválido.');
    }

    return payload;
  }
}
