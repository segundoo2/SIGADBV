/* eslint-disable @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { IAuthRepository } from '../interfaces/auth.repository.interface';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { ITokenService } from '../../../common/adapters/interfaces/token-service.interface';
import {
  IJwtPayload,
  IJwtPayloadWithExpiry,
} from '../interfaces/jwt-payload.interface';
import { EPermission } from '../../../common/enum/role/permissions.enum';
import { EAuthSuccess } from '../../../common/enum/auth/auth-success.enum';
import { LoginDto } from '../dtos/login.dto';
import { EErrorsGlobal } from '../../../common/enum/global/errors-global.enum';
import { ICacheStorageService } from '../../../common/redis/interface/cache-storage.interface';
import { EAuthErrors } from '../../../common/enum/auth/auth-errors.enum';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let mockRepository: jest.Mocked<IAuthRepository>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockRedisService: jest.Mocked<ICacheStorageService>;
  let mockConfigService: ConfigService;
  let validPasswordHash: string;

  const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000000';

  const userDto: LoginDto = {
    username: 'segundo',
    password: '12345678',
  };
  const slug: string = 'sgcode';

  const testFingerprint = 'test-fingerprint';

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash(userDto.password, 10);
  });

  beforeEach(() => {
    process.env.ACCESS_TOKEN_EXPIRES_IN = '15m';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

    mockRepository = {
      findUserByUsername: jest.fn(),
    };
    mockTokenService = {
      signAsync: jest.fn(),
    };
    mockRedisService = {
      setWithExpiry: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    };
    mockConfigService = {
      get: (key: string) => {
        if (key === 'ACCESS_TOKEN_EXPIRES_IN') return '15m';
        if (key === 'REFRESH_TOKEN_EXPIRES_IN') return '7d';
        return undefined;
      },
      getOrThrow: (key: string) =>
        key === 'JWT_SECRET' ? 'test-access-secret' : 'test-refresh-secret',
    } as unknown as ConfigService;

    service = new AuthService(
      mockTokenService,
      mockRepository,
      mockRedisService,
      mockConfigService,
    );
  });

  const mockUser: User = {
    id: 'uuid-user',
    tenantId: DEFAULT_TENANT_ID,
    username: 'segundo',
    mustChangePassword: false,
    password: '12345678',
    roles: [
      {
        id: 'role-1',
        name: 'ADMIN',
        permissions: [EPermission.USERS_READ],
        tenantId: '',
        users: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findTenantIdBySlug', () => {
    it('should return default tenant id when slug is provided', async () => {
      const tenantId = await service['findTenantIdBySlug']('bergcell');

      expect(tenantId).toBe(DEFAULT_TENANT_ID);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when the user is not found', async () => {
      mockRepository.findUserByUsername.mockResolvedValue(null);

      await expect(
        service.login({ ...userDto, slug }, testFingerprint),
      ).rejects.toThrow(new UnauthorizedException(EAuthErrors.USER_NOT_FOUND));
      expect(mockRepository.findUserByUsername).toHaveBeenCalledWith(
        userDto.username,
        DEFAULT_TENANT_ID,
      );
    });

    it('should throw UnauthorizedException when the password is incorrect', async () => {
      mockRepository.findUserByUsername.mockResolvedValue(mockUser);

      await expect(
        service.login({ ...userDto, slug }, testFingerprint),
      ).rejects.toThrow(new UnauthorizedException(EAuthErrors.USER_NOT_FOUND));
    });

    it('should return tokens envelope and user data when user logs in successfully', async () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockRepository.findUserByUsername.mockResolvedValue({
        ...mockUser,
        password: validPasswordHash,
      });

      mockTokenService.signAsync.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/require-await
        async (_payload, options) => {
          if (options?.expiresIn === '15m') return tokens.accessToken;
          if (options?.expiresIn === '7d') return tokens.refreshToken;
          return '';
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...expectedUser } = mockUser;

      const result = await service.login({ ...userDto, slug }, testFingerprint);

      expect(result).toEqual({
        message: EAuthSuccess.LOGIN,
        mustChangePassword: false,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: expectedUser,
        },
      });

      const expectedPayload: IJwtPayload = {
        sub: mockUser.id,
        tenantId: mockUser.tenantId,
        username: mockUser.username,
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        fingerprint: testFingerprint,
      };

      const accessTokenPayload = mockTokenService.signAsync.mock
        .calls[0][0] as IJwtPayload;
      const refreshTokenPayload = mockTokenService.signAsync.mock
        .calls[1][0] as IJwtPayload;

      expect(accessTokenPayload).toMatchObject(expectedPayload);
      expect(accessTokenPayload.jti).toEqual(expect.any(String));
      expect(refreshTokenPayload).toEqual(accessTokenPayload);
    });
  });

  describe('refresh', () => {
    const mockJwtPayload: IJwtPayloadWithExpiry = {
      sub: 'uuid-user',
      tenantId: DEFAULT_TENANT_ID,
      username: 'segundo',
      roles: ['ADMIN'],
      permissions: [EPermission.USERS_READ],
      fingerprint: testFingerprint,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should throw UnauthorizedException when user context cannot be retrieved', async () => {
      mockRepository.findUserByUsername.mockResolvedValue(null);

      await expect(
        service.refresh(mockJwtPayload, testFingerprint),
      ).rejects.toThrow(
        new UnauthorizedException(EErrorsGlobal.FAILED_RETRIEVE_SESSION),
      );
    });

    it('should blacklist old token, rotate tokens and return new token pair with user data', async () => {
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockRepository.findUserByUsername.mockResolvedValue(mockUser);
      mockTokenService.signAsync
        .mockResolvedValueOnce(tokens.accessToken)
        .mockResolvedValueOnce(tokens.refreshToken);
      mockRedisService.setWithExpiry.mockResolvedValue(undefined);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...expectedUser } = mockUser;

      const result = await service.refresh(mockJwtPayload, 'new-fingerprint');

      expect(result).toEqual({
        message: EAuthSuccess.REFRESH,
        mustChangePassword: mockUser.mustChangePassword,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: expectedUser,
        },
      });

      expect(mockRedisService.setWithExpiry).toHaveBeenCalledWith(
        `blacklist:refresh:${mockJwtPayload.sub}:${mockJwtPayload.exp}`,
        'rotated',
        expect.any(Number),
      );
    });
  });

  describe('logout', () => {
    it('should place the active token into the Redis blacklist under revoked status', async () => {
      const mockJwtPayload: IJwtPayloadWithExpiry = {
        sub: 'uuid-user',
        tenantId: DEFAULT_TENANT_ID,
        username: 'segundo',
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        fingerprint: testFingerprint,
        exp: Math.floor(Date.now() / 1000) + 600,
      };

      mockRedisService.setWithExpiry.mockResolvedValue(undefined);

      const result = await service.logout(mockJwtPayload);

      expect(result).toEqual({ message: EAuthSuccess.LOGOUT });
      expect(mockRedisService.setWithExpiry).toHaveBeenCalledWith(
        `blacklist:refresh:${mockJwtPayload.sub}:${mockJwtPayload.exp}`,
        'revoked',
        expect.any(Number),
      );
    });
  });
});
