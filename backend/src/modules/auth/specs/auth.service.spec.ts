/* eslint-disable @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { IAuthRepository } from '../interfaces/auth.repository.interface';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { ITokenService } from '../interfaces/jwt-service.interface';
import {
  IJwtPayload,
  IJwtPayloadWithExpiry,
} from '../interfaces/jwt-payload.interface';
import { RedisService } from '../../../common/redis/redis.service';
import { EPermission } from '../../../common/enum/permissions.enum';
import { EAuthSuccess } from '../../../common/enum/auth-success.enum';
import { LoginDto } from '../dtos/login.dto';
import { EErrorsGlobal } from '../../../common/enum/errors-global.enum';

describe('AuthService', () => {
  let service: AuthService;
  let mockRepository: jest.Mocked<IAuthRepository>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockRedisService: jest.Mocked<RedisService>;
  let validPasswordHash: string;

  const userDto: LoginDto = {
    username: 'segundo',
    password: '12345678',
    tenantId: 'tenant-uuid-123',
  };
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
    } as unknown as jest.Mocked<RedisService>;

    service = new AuthService(
      mockTokenService,
      mockRepository,
      mockRedisService,
    );
  });

  const mockUser = {
    id: 'uuid-user',
    tenantId: 'tenant-uuid-123',
    username: 'user.name',
    password: '12345678',
    roles: [
      {
        id: 'role-1',
        name: 'ADMIN',
        permissions: [{ id: 'perm-1', slug: EPermission.USERS_READ }],
      },
    ],
  } as unknown as User;

  describe('login', () => {
    it('should throw UnauthorizedException when the user is not found', async () => {
      mockRepository.findUserByUsername.mockResolvedValue(null);

      await expect(service.login(userDto, testFingerprint)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockRepository.findUserByUsername).toHaveBeenCalledWith(
        userDto.username,
        userDto.tenantId,
      );
    });

    it('should throw UnauthorizedException when the password is incorrect', async () => {
      mockRepository.findUserByUsername.mockResolvedValue(mockUser);

      await expect(service.login(userDto, testFingerprint)).rejects.toThrow(
        new UnauthorizedException('Senha incorreta.'),
      );
    });

    it('should return tokens envelope when user logs in successfully', async () => {
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

      const result = await service.login(userDto, testFingerprint);

      expect(result).toEqual({
        message: EAuthSuccess.LOGIN,
        data: tokens,
      });

      const expectedPayload: IJwtPayload = {
        sub: mockUser.id,
        tenantId: mockUser.tenantId,
        username: mockUser.username,
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        fingerprint: testFingerprint,
      };

      expect(mockTokenService.signAsync).toHaveBeenCalledWith(expectedPayload, {
        expiresIn: '15m',
      });
    });
  });

  describe('refresh', () => {
    const mockJwtPayload: IJwtPayloadWithExpiry = {
      sub: 'uuid-user',
      tenantId: 'tenant-uuid-123',
      username: 'user.name',
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

    it('should blacklist old token and return new token pair', async () => {
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockRepository.findUserByUsername.mockResolvedValue(mockUser);
      mockTokenService.signAsync
        .mockResolvedValueOnce(tokens.accessToken)
        .mockResolvedValueOnce(tokens.refreshToken);
      mockRedisService.setWithExpiry.mockResolvedValue(undefined);

      const result = await service.refresh(mockJwtPayload, 'new-fingerprint');

      expect(result).toEqual({
        message: EAuthSuccess.REFRESH,
        data: tokens,
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
        tenantId: 'tenant-uuid-123',
        username: 'user.name',
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
