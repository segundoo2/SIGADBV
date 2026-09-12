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

  const userDto: Pick<UserDto, 'username'> & { tenantId: string } = {
    username: 'segundo',
    tenantId: '00000000-0000-0000-0000-000000000000',
  };

  const mockUser = {
    id: 'uuid-user',
    tenantId: userDto.tenantId,
    username: 'segundo',
    password: 'hashed-password',
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [
      {
        id: 'role-1',
        tenantId: userDto.tenantId,
        name: 'ADMIN',
        permissions: [{ id: 'perm-1', slug: 'users.read' }],
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
    it('should return user with roles and nested permissions relation when found based on username and tenantId', async () => {
      ormRepositoryMock.findOne.mockResolvedValue(mockUser);

      const result = await repository.findUserByUsername(
        userDto.username,
        userDto.tenantId,
      );

      expect(result).toBe(mockUser);
      expect(ormRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { username: userDto.username, tenantId: userDto.tenantId },
        relations: {
          roles: true,
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
