import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, ObjectLiteral, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ESuccess } from '../enum/success.enum';
import { UsersRepository } from '../users.repository';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../enum/errors-global.enum';
import { createFakeUser } from '../helpers/create-fake-user.helper';
import { UserDto } from '../dto/user.dto';
import { UpdateResult } from 'typeorm/browser';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let ormRepositoryMock: MockRepository<User>;

  beforeEach(async () => {
    const mockFactory = (): MockRepository<User> => ({
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
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
    const user = createFakeUser();
    user.password = '12345678';
    const userDto: UserDto = {
      username: user.username as string,
      password: user.password,
    };

    it(`should return the message "${ESuccess.CREATE_USER}", if the user is successfully registered`, async () => {
      ormRepositoryMock.create?.mockReturnValue(user);

      await repository.createUser(userDto);
      expect(ormRepositoryMock.create).toHaveBeenCalledWith(userDto);
      expect(ormRepositoryMock.save).toHaveBeenCalledWith(user);
    });

    shouldHandleDatabaseErrors(
      () => repository.createUser(userDto),
      () => ormRepositoryMock.save,
    );
  });

  describe('updateUserPassword', () => {
    const user = createFakeUser();
    user.password = '12345678';
    const userDto: UserDto = {
      username: user.username as string,
      password: user.password,
    };
    const response: UpdateResult = {
      raw: [],
      affected: 0,
      generatedMaps: [],
    };

    it('should return { raw: [], affected: 1, generatedMaps: [] } when the password has successfully persisted', async () => {
      response.affected = 1;
      ormRepositoryMock.update?.mockResolvedValue(response);
      expect(await repository.updateUserPassword(userDto)).toEqual(response);
      expect(ormRepositoryMock.update).toHaveBeenCalledWith(userDto.username, {
        password: userDto.password,
      });
    });

    it('should return { raw: [], affected: 1, generatedMaps: [] } when the user not found', async () => {
      ormRepositoryMock.update?.mockResolvedValue(response);
      expect(await repository.updateUserPassword(userDto)).toEqual(response);
    });

    shouldHandleDatabaseErrors(
      () => repository.updateUserPassword(userDto),
      () => ormRepositoryMock.update,
    );
  });

  describe('findAllUsers', () => {
    it('should return all registred users', async () => {
      const usersMock = [createFakeUser(), createFakeUser()];
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
    const user = createFakeUser();

    it('should return a user when found in the database by TypeORM', async () => {
      ormRepositoryMock.findOne?.mockResolvedValue(user);

      expect(await repository.findOneByUsername('segundo')).toEqual(user);
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
