import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { IJwtPayloadWithExpiry } from '../../modules/auth/interfaces/jwt-payload.interface';
import { RequestWithCookies } from '../strategies/interfaces/req-with-cookies.interface';

function isJwtPayload(user: unknown): user is IJwtPayloadWithExpiry {
  return (
    typeof user === 'object' &&
    user !== null &&
    'sub' in user &&
    'tenantId' in user &&
    'exp' in user
  );
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IJwtPayloadWithExpiry => {
    const request = ctx.switchToHttp().getRequest<RequestWithCookies>();
    const user = request.user;

    if (!isJwtPayload(user)) {
      throw new UnauthorizedException(
        'Payload de usuário inválido ou não encontrado na requisição.',
      );
    }

    return user;
  },
);
