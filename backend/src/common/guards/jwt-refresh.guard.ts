import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EErrorsGlobal } from '../enum/global/errors-global.enum';
import type { ICacheStorageService } from '../../common/redis/interface/cache-storage.interface';
import { IJwtPayloadWithExpiry } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  constructor(
    @Inject('ICacheStorageService')
    private readonly redisService: ICacheStorageService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isValid = (await super.canActivate(context)) as boolean;
    if (!isValid) {
      return false;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: IJwtPayloadWithExpiry }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(EErrorsGlobal.FAILED_RETRIEVE_SESSION);
    }

    const isBlacklisted = await this.redisService.get(
      `blacklist:refresh:${user.sub}:${user.exp}`,
    );

    if (isBlacklisted) {
      throw new UnauthorizedException(EErrorsGlobal.FAILED_RETRIEVE_SESSION);
    }

    return true;
  }

  handleRequest<TUser>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedException(EErrorsGlobal.FAILED_RETRIEVE_SESSION);
    }
    return user;
  }
}
