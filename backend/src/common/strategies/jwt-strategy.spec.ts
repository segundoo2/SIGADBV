import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { IJwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { RequestWithCookies } from './interfaces/req-with-cookies.interface';
import { JwtStrategy, cookieJwtExtractor } from './jwt.strategy';
import { EPermission } from '../../common/enum/role/permissions.enum';
import { EErrorsGlobal } from '../enum/global/errors-global.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

    it('should return null when cookies or access_token are missing', () => {
      const mockRequestWithoutCookies = {} as unknown as RequestWithCookies;
      expect(cookieJwtExtractor(mockRequestWithoutCookies)).toBeNull();

      const mockRequestWithoutToken = {
        cookies: {},
      } as unknown as RequestWithCookies;
      expect(cookieJwtExtractor(mockRequestWithoutToken)).toBeNull();
    });
  });

  describe('validate', () => {
    it('should return the payload when payload is valid', () => {
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

    it('should throw UnauthorizedException when payload is null or missing sub', () => {
      expect(() => strategy.validate(null)).toThrow(
        new UnauthorizedException(EErrorsGlobal.FAILED_RETRIEVE_SESSION),
      );

      expect(() => strategy.validate({} as unknown as IJwtPayload)).toThrow(
        new UnauthorizedException(EErrorsGlobal.FAILED_RETRIEVE_SESSION),
      );
    });
  });
});
