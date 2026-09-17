import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';
import { IResponse } from '../interfaces/response.interface';
import { ITokens } from '../../modules/auth/interfaces/token.interface';

@Injectable()
export class SetCookiesInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<IResponse<ITokens>>,
  ): Observable<Omit<IResponse<ITokens>, 'data'>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((result: IResponse<ITokens> & { mustChangePassword?: boolean }) => {
        if (result.data.accessToken && result.data.refreshToken) {
          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development' ? true : false,
            sameSite: 'strict' as const,
            path: '/',
          };

          response.cookie('access_token', result.data.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
          });
          response.cookie('refresh_token', result.data.refreshToken, {
            ...cookieOptions,
            path: '/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });
          return {
            message: result.message,
            mustChangePassword: result.mustChangePassword,
          };
        }

        return result;
      }),
    );
  }
}
