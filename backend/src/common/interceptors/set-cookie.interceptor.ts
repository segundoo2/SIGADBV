import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { CookieOptions, Response } from 'express';
import { IResponse } from '../interfaces/response.interface';
import { ITokens } from '../../modules/auth/interfaces/token.interface';
import { User } from '../../modules/users/entities/user.entity';
import { ILoginResponse } from '../../modules/auth/interfaces/login-response.interface';

type SanitizedResponsePayload = IResponse<
  Partial<ITokens> & { user?: Omit<User, 'password'> }
> & {
  mustChangePassword?: boolean;
};

@Injectable()
export class SetCookiesInterceptor implements NestInterceptor<
  ILoginResponse,
  SanitizedResponsePayload
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<ILoginResponse>,
  ): Observable<SanitizedResponsePayload> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((result: ILoginResponse): SanitizedResponsePayload => {
        if (result?.data?.accessToken && result?.data?.refreshToken) {
          const isDev = process.env.NODE_ENV === 'development';

          const cookieOptions: CookieOptions = {
            httpOnly: true,
            secure: !isDev,
            sameSite: 'strict',
            path: '/',
          };

          response.cookie('access_token', result.data.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000, // 15 minutos
          });

          response.cookie('refresh_token', result.data.refreshToken, {
            ...cookieOptions,
            path: '/auth', // Restringe o refresh token ao endpoint de autenticação
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
          });

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { accessToken, refreshToken, ...restData } = result.data;

          return {
            ...result,
            data: restData,
          };
        }

        return result;
      }),
    );
  }
}
