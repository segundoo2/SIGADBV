import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { IJwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { RequestWithCookies } from '../../modules/auth/interfaces/req-with-cookies.interface';
import { JwtStrategy, cookieJwtExtractor } from './jwt.strategy';
import { EPermission } from '../enum/permissions.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('jwtFromRequest (Extractor)', () => {
    it('should extract access_token from cookies', () => {
      const mockRequest = {
        cookies: {
          access_token: 'valid-access-token',
        },
      } as unknown as RequestWithCookies;

      const result = cookieJwtExtractor(mockRequest);
      expect(result).toBe('valid-access-token');
    });
  });

  describe('validate', () => {
    it('should return the payload when valid', () => {
      const mockPayload: IJwtPayload = {
        sub: 'user-id-123',
        tenantId: 'tenant-uuid-123',
        username: 'user.name',
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        fingerprint: 'any-fingerprint',
      };
      const result = strategy.validate(mockPayload);
      expect(result).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException when payload is null or undefined', () => {
      expect(() => strategy.validate(null as unknown as IJwtPayload)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
