import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { Response } from 'express';
import { SetCookiesInterceptor } from './set-cookie.interceptor';
import { ILoginResponse } from '../../modules/auth/interfaces/login-response.interface';

describe('SetCookiesInterceptor', () => {
  let interceptor: SetCookiesInterceptor;
  let mockContext: Partial<ExecutionContext>;
  let mockResponse: Pick<Response, 'cookie'>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
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

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should extract tokens from data, set cookies in production and preserve user data in payload', async () => {
    process.env.NODE_ENV = 'production';

    const mockServiceResult: ILoginResponse = {
      message: 'LOGIN_SUCCESS',
      mustChangePassword: false,
      data: {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        user: {
          id: 'user-uuid-1',
          username: 'john.doe',
          tenantId: 'tenant-uuid-1',
          mustChangePassword: false,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };

    const mockCallHandler: CallHandler<ILoginResponse> = {
      handle: () => of(mockServiceResult),
    };

    const result = await firstValueFrom(
      interceptor.intercept(mockContext as ExecutionContext, mockCallHandler),
    );

    // Valida o access_token com secure: true (produção)
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

    // Valida o refresh_token com secure: true (produção)
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

    // Valida o payload saneado
    expect(result).toBeDefined();
    expect(result.message).toBe('LOGIN_SUCCESS');
    expect(result.mustChangePassword).toBe(false);
    expect(result.data.accessToken).toBeUndefined();
    expect(result.data.refreshToken).toBeUndefined();
    expect(result.data.user).toBeDefined();
    expect(result.data.user?.username).toBe('john.doe');
  });

  it('should set secure to false when running in development environment', async () => {
    process.env.NODE_ENV = 'development';

    const mockServiceResult: ILoginResponse = {
      message: 'LOGIN_SUCCESS',
      mustChangePassword: false,
      data: {
        accessToken: 'access-dev',
        refreshToken: 'refresh-dev',
        user: {
          id: 'user-uuid-2',
          username: 'dev.user',
          tenantId: 'tenant-uuid-1',
          mustChangePassword: false,
          roles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };

    const mockCallHandler: CallHandler<ILoginResponse> = {
      handle: () => of(mockServiceResult),
    };

    await firstValueFrom(
      interceptor.intercept(mockContext as ExecutionContext, mockCallHandler),
    );

    // Valida se o secure está como false no ambiente de desenvolvimento
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'access_token',
      'access-dev',
      expect.objectContaining({
        secure: false,
      }),
    );

    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-dev',
      expect.objectContaining({
        secure: false,
      }),
    );
  });

  it('should pass through the response unmodified if tokens are missing', async () => {
    const mockServiceResult: Record<string, unknown> = {
      message: 'GENERAL_SUCCESS',
      data: {
        status: 'OK',
      },
    };

    const mockCallHandler: CallHandler<Record<string, unknown>> = {
      handle: () => of(mockServiceResult),
    };

    const result = await firstValueFrom(
      interceptor.intercept(
        mockContext as ExecutionContext,
        mockCallHandler as unknown as CallHandler<ILoginResponse>,
      ),
    );

    // Valida que nenhum cookie foi setado
    expect(mockResponse.cookie).not.toHaveBeenCalled();

    // Valida que o resultado permaneceu exatamente o mesmo
    expect(result).toEqual(mockServiceResult);
  });
});
