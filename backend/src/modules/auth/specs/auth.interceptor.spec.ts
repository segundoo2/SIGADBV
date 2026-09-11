import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { Response } from 'express';
import { SetCookiesInterceptor } from '../../../common/interceptors/auth.interceptor';
import { IAuthPayload } from '../interfaces/auth-payload.interface';

describe('SetCookiesInterceptor', () => {
  let interceptor: SetCookiesInterceptor;
  let mockContext: Partial<ExecutionContext>;
  let mockResponse: Pick<Response, 'cookie'>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Garante que o ambiente de teste seja previsível
    process.env.NODE_ENV = 'production';

    interceptor = new SetCookiesInterceptor();

    mockResponse = {
      cookie: jest.fn(),
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    };
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should extract tokens from data and append them to cookies', async () => {
    const mockServiceResult: IAuthPayload = {
      message: 'LOGIN_SUCCESS',
      data: {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      },
    };

    const mockCallHandler: CallHandler<IAuthPayload> = {
      handle: () => of(mockServiceResult),
    };

    const result = await firstValueFrom(
      interceptor.intercept(mockContext as ExecutionContext, mockCallHandler),
    );

    // 1. Valida a chamada do access_token
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'access_token',
      'access-123',
      {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 900000,
        path: '/',
      },
    );

    // 2. Valida a chamada do refresh_token
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-456',
      {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 604800000,
        path: '/auth',
      },
    );

    // 3. Valida a limpeza ou retorno do payload
    expect(result).toBeDefined();
  });
});
