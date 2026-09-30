import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IJwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { RequestWithCookies } from './interfaces/req-with-cookies.interface';
import { User } from '../../modules/users/entities/user.entity';

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
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: cookieJwtExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret-key',
    });
  }

  async validate(payload: IJwtPayload): Promise<User> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: { roles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return user;
  }
}
