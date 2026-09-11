import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { IJwtPayloadWithExpiry } from '../../modules/auth/interfaces/jwt-payload.interface';
import { RequestWithCookies } from '../../modules/auth/interfaces/req-with-cookies.interface';
import { RedisService } from '../redis/redis.service';
import { EErrorsGlobal } from '../enum/errors-global.enum';

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
  constructor(private readonly redisService: RedisService) {
    super({
      jwtFromRequest: cookieRefreshExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
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
      (req.headers['x-device-id'] as string) ||
      (req.headers['user-agent'] as string) ||
      'unknown';

    if (payload.fingerprint !== currentFingerprint) {
      throw new UnauthorizedException('Dispositivo divergente. Acesso negado.');
    }

    // 2. Validação na Blacklist do Redis
    const blacklistKey = `blacklist:refresh:${payload.sub}:${payload.exp}`;
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
