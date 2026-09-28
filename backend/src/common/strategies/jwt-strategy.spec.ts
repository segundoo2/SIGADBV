/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IJwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { RequestWithCookies } from './interfaces/req-with-cookies.interface';
import { JwtStrategy, cookieJwtExtractor } from './jwt.strategy';
import { EPermission } from '../../common/enum/role/permissions.enum';
import { User } from '../../modules/users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 'user-id-123',
    username: 'user.name',
    roles: [],
  } as unknown as User;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get(getRepositoryToken(User));
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
    it('should return the user when payload is valid and user exists', async () => {
      const mockPayload: IJwtPayload = {
        sub: 'user-id-123',
        tenantId: 'tenant-uuid-123',
        username: 'user.name',
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        fingerprint: 'any-fingerprint',
      };

      userRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await strategy.validate(mockPayload);
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
        relations: { roles: true },
      });
    });

    it('should throw UnauthorizedException when payload is null or missing sub', async () => {
      await expect(strategy.validate(null)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(
        strategy.validate({} as unknown as IJwtPayload),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not found in database', async () => {
      const mockPayload: IJwtPayload = {
        sub: 'non-existent-id',
        tenantId: 'tenant-uuid-123',
        username: 'user.name',
        roles: ['ADMIN'],
        permissions: [EPermission.USERS_READ],
        fingerprint: 'any-fingerprint',
      };

      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
