/* eslint-disable @typescript-eslint/unbound-method */
import { AuthController } from '../auth.controller';
import { IAuthService } from '../interfaces/auth.service.interface';
import { IJwtPayloadWithExpiry } from '../interfaces/jwt-payload.interface';
import { RequestWithCookies } from '../interfaces/req-with-cookies.interface';
import { LoginDto } from '../dtos/login.dto';
import { EPermission } from '../../../common/enum/permissions.enum';
import type { Response, Request } from 'express';
import { EAuthSuccess } from '../../../common/enum/auth-success.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let mockService: jest.Mocked<IAuthService>;

  const mockRequest = {
    headers: {
      'user-agent': 'test-agent',
    },
    user: null,
  } as unknown as Request;

  beforeEach(() => {
    mockService = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };
    controller = new AuthController(mockService);
  });

  const loginDto: LoginDto = {
    username: 'segundo',
    password: '12345678',
    tenantId: 'tenant-uuid-123',
  };

  describe('login', () => {
    it('should return the object envelope when the user logs in successfully', async () => {
      const mockResponseData = {
        message: EAuthSuccess.LOGIN,
        data: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      };

      mockService.login.mockResolvedValue(mockResponseData);

      const result = await controller.login(mockRequest, loginDto);

      expect(mockService.login).toHaveBeenCalledWith(loginDto, 'test-agent');
      expect(result).toEqual(mockResponseData);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with user payload and return new tokens', async () => {
      const mockJwtPayload: IJwtPayloadWithExpiry = {
        sub: 'user-id-123',
        tenantId: 'tenant-uuid-123',
        username: 'user.name',
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        fingerprint: 'test-agent',
        exp: 1718900000,
        iat: 1718800000,
      };

      const mockAuthPayload = {
        message: EAuthSuccess.REFRESH,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };

      const mockRefreshRequest = {
        headers: {
          'user-agent': 'test-agent',
        },
        user: mockJwtPayload,
      } as unknown as RequestWithCookies;

      mockService.refresh.mockResolvedValue(mockAuthPayload);

      const result = await controller.refresh(mockRefreshRequest);

      expect(mockService.refresh).toHaveBeenCalledWith(
        mockJwtPayload,
        'test-agent',
      );
      expect(result).toEqual(mockAuthPayload);
    });
  });

  describe('logout', () => {
    it('should clear access and refresh tokens from cookies, invoke service logout and return a success response', async () => {
      const mockJwtPayload: IJwtPayloadWithExpiry = {
        sub: 'user-id-123',
        username: 'user.name',
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        tenantId: 'tenant-uuid-123',
        fingerprint: 'test-agent',
        exp: 1718900000,
        iat: 1718800000,
      };

      const mockResponse = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      const mockLogoutRequest = {
        headers: {
          'user-agent': 'test-agent',
        },
        user: mockJwtPayload,
      } as unknown as RequestWithCookies;

      (mockResponse.json as jest.Mock).mockImplementation(
        (body: unknown) => body,
      );
      mockService.logout.mockResolvedValue({ message: EAuthSuccess.LOGOUT });

      const result = await controller.logout(mockLogoutRequest, mockResponse);

      const isProd = process.env.NODE_ENV === 'production';
      const expectedBaseOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict' as const,
      };

      expect(mockService.logout).toHaveBeenCalledWith(mockJwtPayload);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token', {
        ...expectedBaseOptions,
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
        ...expectedBaseOptions,
        path: '/auth',
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: EAuthSuccess.LOGOUT,
      });
      expect(result).toEqual({ message: EAuthSuccess.LOGOUT });
    });
  });
});
