import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, ObjectLiteral, Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { ESuccess } from '../enum/success.enum';
import { UsersRepository } from '../users.repository';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../enum/errors-global.enum';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let ormRepositoryMock: MockRepository<User>;

  const createFakeUser = (username = 'edilson.segundo'): User => ({
    id: 'some-uuid-or-id',
    username,
    password: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockFactory = (): MockRepository<User> => ({
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getRepositoryToken(User),
          useFactory: mockFactory,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    ormRepositoryMock = module.get<MockRepository<User>>(
      getRepositoryToken(User),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const shouldHandleDatabaseErrors = (
    operation: () => Promise<unknown>,
    mockMethod: () => jest.Mock | undefined,
  ) => {
    it('should return InternalServerException when TypeORM throws an error', async () => {
      mockMethod()?.mockRejectedValue(
        new Error('[TypeOrmModule] Unable to connect to the database'),
      );

      await expect(operation()).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  };

  describe('createUser', () => {
    const mockDto: CreateUserDto = {
      username: 'Edilson Segundo',
      password: '12345678',
    };
    const mockUserInstance: User = {
      id: 'um-id-qualquer',
      ...mockDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it(`should return the message "${ESuccess.USER_REGISTER}", if the user is successfully registered`, async () => {
      ormRepositoryMock.create?.mockReturnValue(mockUserInstance);
      ormRepositoryMock.save?.mockResolvedValue(mockUserInstance);

      expect(await repository.createUser(mockDto)).toBe(ESuccess.USER_REGISTER);
      expect(ormRepositoryMock.create).toHaveBeenCalledWith(mockDto);
      expect(ormRepositoryMock.save).toHaveBeenCalledWith(mockUserInstance);
    });

    shouldHandleDatabaseErrors(
      () => repository.createUser(mockDto),
      () => ormRepositoryMock.save,
    );
  });

  describe('updateUserPassword', () => {
    const userMock: User = createFakeUser('edilson.segundo');

    it('should return the temporary password if the data is successfully persisted to the database', async () => {
      ormRepositoryMock.save?.mockResolvedValue(userMock.password);

      expect(await repository.updateUserPassword(userMock)).toBe(
        userMock.password,
      );
      expect(ormRepositoryMock.save).toHaveBeenCalledWith(userMock);
    });

    shouldHandleDatabaseErrors(
      () => repository.updateUserPassword(userMock),
      () => ormRepositoryMock.save,
    );
  });

  describe('findAllUsers', () => {
    it('should return all registred users', async () => {
      const usersMock = [createFakeUser('segundo'), createFakeUser('segundo')];
      ormRepositoryMock.find?.mockResolvedValue(usersMock);

      expect(await repository.findAllUsers()).toEqual(usersMock);
    });

    it('should return an empty array if no user is found', async () => {
      ormRepositoryMock.find?.mockResolvedValue([]);

      expect(await repository.findAllUsers()).toBeNull();
    });

    it('should return null when there is no registered user', async () => {
      ormRepositoryMock.find?.mockResolvedValue([]);

      expect(await repository.findAllUsers()).toBeNull();
    });

    shouldHandleDatabaseErrors(
      () => repository.findAllUsers(),
      () => ormRepositoryMock.find,
    );
  });

  describe('findOneByUsername', () => {
    it('should return a user when found in the database by TypeORM', async () => {
      const mockUser = createFakeUser('john_doe');
      ormRepositoryMock.findOne?.mockResolvedValue(mockUser);

      expect(await repository.findOneByUsername(mockUser.username)).toEqual(
        mockUser,
      );
    });

    it('should return null if TypeORM does not find the user', async () => {
      ormRepositoryMock.findOne?.mockResolvedValue(null);

      expect(await repository.findOneByUsername('segundo')).toBeNull();
    });

    shouldHandleDatabaseErrors(
      () => repository.findOneByUsername('segundo'),
      () => ormRepositoryMock.findOne,
    );
  });

  describe('deleteUser', () => {
    const response: DeleteResult = { raw: [], affected: 1 };

    it('should return the delete result when the user is successfully deleted.', async () => {
      ormRepositoryMock.delete?.mockResolvedValue(response);

      expect(await repository.deleteUser('segundo')).toEqual(response);
    });

    it('should return the delete result with 0 affected rows when the user is not found in the database.', async () => {
      ormRepositoryMock.delete?.mockResolvedValue({ ...response, affected: 0 });

      expect(await repository.deleteUser('segundo')).toEqual({
        ...response,
        affected: 0,
      });
    });

    shouldHandleDatabaseErrors(
      () => repository.deleteUser('segundo'),
      () => ormRepositoryMock.delete,
    );
  });
});
