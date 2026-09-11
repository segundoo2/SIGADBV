/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { IJwtPayloadWithExpiry } from '../../modules/auth/interfaces/jwt-payload.interface';
import { RequestWithCookies } from '../../modules/auth/interfaces/req-with-cookies.interface';
import { JwtRefreshStrategy } from './refresh-token.strategy';
import { RedisService } from '../redis/redis.service';
import { EPermission } from '../enum/permissions.enum';

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    mockRedisService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshStrategy,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the payload when fingerprints match and token is not blacklisted', async () => {
      const mockPayload: IJwtPayloadWithExpiry = {
        sub: 'user-id-123',
        tenantId: 'tenant-uuid-123',
        username: 'test@example.com',
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        fingerprint: 'matched-device',
        exp: 1718900000,
      };

      const mockRequest = {
        headers: {
          'user-agent': 'matched-device',
        },
      } as unknown as RequestWithCookies;

      mockRedisService.get.mockResolvedValue(null);

      const result = await strategy.validate(mockRequest, mockPayload);
      expect(result).toEqual(mockPayload);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        `blacklist:refresh:${mockPayload.sub}:${mockPayload.exp}`,
      );
    });

    it('should throw UnauthorizedException when fingerprints mismatch', async () => {
      const mockPayload: IJwtPayloadWithExpiry = {
        sub: 'user-id-123',
        tenantId: 'tenant-uuid-123',
        username: 'test@example.com',
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        fingerprint: 'device-alpha',
        exp: 1718900000,
      };

      const mockRequest = {
        headers: {
          'user-agent': 'device-omega',
        },
      } as unknown as RequestWithCookies;

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
