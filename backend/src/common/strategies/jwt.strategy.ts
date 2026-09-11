import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { IJwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { RequestWithCookies } from '../../modules/auth/interfaces/req-with-cookies.interface';

export const cookieJwtExtractor = (req: RequestWithCookies): string | null => {
  const strictReq = req;
  if (strictReq && strictReq.cookies) {
    const token = strictReq.cookies['access_token'];
    if (token) return token;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: cookieJwtExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret-key',
    });
  }

  validate(payload: IJwtPayload): IJwtPayload {
    if (!payload) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    return payload;
  }
}
