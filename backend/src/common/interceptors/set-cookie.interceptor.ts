import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { IAuthPayload } from '../../modules/auth/interfaces/auth-payload.interface';
import { Response } from 'express';

@Injectable()
export class SetCookiesInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<IAuthPayload>,
  ): Observable<Omit<IAuthPayload, 'data'>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((result: IAuthPayload) => {
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
          return { message: result.message };
        }

        return result;
      }),
    );
  }
}
