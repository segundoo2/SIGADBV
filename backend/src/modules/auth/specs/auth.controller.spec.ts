/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { IAuthService } from '../interfaces/auth.service.interface';
import { IJwtPayloadWithExpiry } from '../interfaces/jwt-payload.interface';
import { LoginDto } from '../dtos/login.dto';
import { EPermission } from '../../../common/enum/role/permissions.enum';
import type { Response } from 'express';
import { EAuthSuccess } from '../../../common/enum/auth/auth-success.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let mockService: jest.Mocked<IAuthService>;

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
  };

  const mockJwtPayload: IJwtPayloadWithExpiry = {
    sub: 'user-id-123',
    tenantId: 'tenant-uuid-123',
    username: 'segundo',
    roles: ['ADMIN'],
    permissions: [EPermission.USERS_READ],
    fingerprint: 'test-agent',
    exp: 1718900000,
    iat: 1718800000,
  };

  describe('login', () => {
    it('should return the object envelope when the user logs in successfully with tenant slug', async () => {
      const mockResponseData = {
        message: EAuthSuccess.LOGIN,
        mustChangePassword: true,
        data: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      };

      mockService.login.mockResolvedValue(mockResponseData);

      const tenantSlug = 'empresa-abc';
      const deviceId = undefined;
      const userAgent = 'test-agent';

      const result = await controller.login(
        tenantSlug,
        deviceId,
        userAgent,
        loginDto,
      );

      expect(mockService.login).toHaveBeenCalledWith(
        { ...loginDto, slug: tenantSlug },
        'test-agent',
      );
      expect(result).toEqual(mockResponseData);
    });

    it('should prioritize x-device-id over user-agent for fingerprint if present', async () => {
      const mockResponseData = {
        message: EAuthSuccess.LOGIN,
        mustChangePassword: false,
        data: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      };

      mockService.login.mockResolvedValue(mockResponseData);

      const tenantSlug = 'empresa-abc';
      const deviceId = 'uuid-device-123';
      const userAgent = 'test-agent';

      await controller.login(tenantSlug, deviceId, userAgent, loginDto);

      expect(mockService.login).toHaveBeenCalledWith(
        { ...loginDto, slug: tenantSlug },
        'uuid-device-123',
      );
    });

    it('should throw BadRequestException when x-tenant-slug header is missing', async () => {
      const tenantSlug = undefined;
      const deviceId = undefined;
      const userAgent = 'test-agent';

      await expect(
        controller.login(tenantSlug, deviceId, userAgent, loginDto),
      ).rejects.toThrow(BadRequestException);

      expect(mockService.login).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with user payload and return new tokens', async () => {
      const mockAuthPayload = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockService.refresh.mockResolvedValue(mockAuthPayload);

      const deviceId = undefined;
      const userAgent = 'test-agent';

      const result = await controller.refresh(
        mockJwtPayload,
        deviceId,
        userAgent,
      );

      expect(mockService.refresh).toHaveBeenCalledWith(
        mockJwtPayload,
        'test-agent',
      );
      expect(result).toEqual(mockAuthPayload);
    });
  });

  describe('logout', () => {
    it('should clear access and refresh tokens from cookies, invoke service logout and return success', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      (mockResponse.json as jest.Mock).mockImplementation(
        (body: unknown) => body,
      );
      mockService.logout.mockResolvedValue({ message: EAuthSuccess.LOGOUT });

      const result = await controller.logout(mockJwtPayload, mockResponse);

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
