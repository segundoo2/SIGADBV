import { ObjectLiteral, Repository } from 'typeorm';
import { UserDto } from '../../users/dtos/user.dto';
import { User } from '../../users/entities/user.entity';
import { AuthRepository } from '../auth.repository';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../common/enum/errors-global.enum';

type MockRepository<T extends ObjectLiteral> = Record<
  keyof Repository<T>,
  jest.Mock
>;

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let ormRepositoryMock: MockRepository<User>;

  const userDto: Pick<UserDto, 'username' | 'tenantId'> = {
    username: 'segundo',
    tenantId: 'tenant-uuid-123',
  };

  const mockUser = {
    id: 'uuid-user',
    tenantId: 'tenant-uuid-123',
    username: 'segundo',
    password: 'hashed-password',
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [
      {
        id: 'role-1',
        tenantId: 'tenant-uuid-123',
        name: 'ADMIN',
        permissions: ['users.read', 'products.read'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  } as unknown as User;

  beforeEach(() => {
    ormRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as unknown as MockRepository<User>;

    repository = new AuthRepository(
      ormRepositoryMock as unknown as Repository<User>,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  describe('findUserByUsername', () => {
    it('should return user with roles relation when found based on username and tenantId', async () => {
      ormRepositoryMock.findOne.mockResolvedValue(mockUser);

      const result = await repository.findUserByUsername(
        userDto.username,
        userDto.tenantId,
      );

      expect(result).toBe(mockUser);
      expect(ormRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { username: userDto.username, tenantId: userDto.tenantId },
        relations: {
          roles: {
            permissions: true,
          },
        },
      });
    });

    it('should return null when the user is not found in that specific tenant', async () => {
      ormRepositoryMock.findOne.mockResolvedValue(null);

      const result = await repository.findUserByUsername(
        userDto.username,
        userDto.tenantId,
      );

      expect(result).toBe(null);
    });

    it('should throw InternalServerErrorException when TypeORM throws a database error', async () => {
      ormRepositoryMock.findOne.mockRejectedValue(
        new Error('[TypeOrmModule] Connection context dropped'),
      );

      await expect(
        repository.findUserByUsername(userDto.username, userDto.tenantId),
      ).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  });
});
