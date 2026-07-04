/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { ESuccess } from '../enum/success.enum';
import { IUsersRepository } from '../interface/users.repository.interface';
import { UsersService } from '../users.service';
import { EErrors } from '../enum/errors.enum';
import { User } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: jest.Mocked<IUsersRepository>;

  const createFakeUser = (username = 'edilson.segundo'): User => ({
    id: 'some-uuid-or-id',
    username,
    password: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockRepository = {
      createUser: jest.fn(),
      updateUserPassword: jest.fn(),
      findAllUsers: jest.fn(),
      findOneByUsername: jest.fn(),
      deleteUser: jest.fn(),
    };
    service = new UsersService(mockRepository);
  });

  // Passamos o nome do método e a função que deve ser executada para o laço testar todos de uma vez
  describe('Shared Username Validation Guard', () => {
    it.each([
      { label: 'undefined', value: undefined as unknown as string },
      { label: 'empty string', value: '' },
      { label: 'only spaces', value: '   ' },
    ])(
      'should throw BadRequestException if username is $label',
      async ({ value }) => {
        await expect(service.updateUserPassword(value)).rejects.toThrow(
          new BadRequestException(EErrors.USERNAME_INVALID),
        );
        await expect(service.findOneByUsername(value)).rejects.toThrow(
          new BadRequestException(EErrors.USERNAME_INVALID),
        );
        await expect(service.deleteUser(value)).rejects.toThrow(
          new BadRequestException(EErrors.USERNAME_INVALID),
        );
      },
    );
  });

  // ✅ CENTRALIZAÇÃO DAS VALIDAÇÕES DE USUÁRIO NÃO ENCONTRADO
  describe('Shared NotFoundException Guard', () => {
    it.each([
      {
        methodName: 'updateUserPassword',
        action: (username: string) => service.updateUserPassword(username),
      },
      {
        methodName: 'findOneByUsername',
        action: (username: string) => service.findOneByUsername(username),
      },
      {
        methodName: 'deleteUser',
        action: (username: string) => service.deleteUser(username),
      },
    ])(
      'should throw NotFoundException inside $methodName if user does not exist',
      async ({ action }) => {
        mockRepository.findOneByUsername.mockResolvedValue(null);

        await expect(action('any-username')).rejects.toThrow(
          new NotFoundException(EErrors.USER_NOT_FOUND),
        );
      },
    );
  });

  describe('Create', () => {
    const payload: CreateUserDto = {
      username: 'Edilson',
      password: '12345678',
    };

    it('should return success message if the user is successfully registered', async () => {
      mockRepository.createUser.mockResolvedValue(ESuccess.USER_REGISTER);
      expect(await service.createUser(payload)).toBe(ESuccess.USER_REGISTER);
    });

    it('should throw ConflictException if the username is already registered', async () => {
      mockRepository.findOneByUsername.mockResolvedValue(
        createFakeUser('edilson.segundo'),
      );
      await expect(service.createUser(payload)).rejects.toThrow(
        new ConflictException(EErrors.USERNAME_EXIST),
      );
    });
  });

  describe('UpdateUserPassword', () => {
    const username = 'edilson.segundo';

    it('should return the temporary password if updated successfully', async () => {
      let passwordCaptured = '';
      mockRepository.findOneByUsername.mockResolvedValue(
        createFakeUser(username),
      );
      mockRepository.updateUserPassword.mockImplementation(
        (_, password: string) => {
          passwordCaptured = password;
          return Promise.resolve(password);
        },
      );

      const result = await service.updateUserPassword(username);
      expect(result).toBe(passwordCaptured);
      expect(mockRepository.updateUserPassword).toHaveBeenCalledWith(
        username,
        expect.any(String),
      );
    });
  });

  describe('FindAllUsers', () => {
    it('should return users response list payload', async () => {
      const usersMock: Partial<User>[] = ['segundo123', 'oliveira_dev'].map(
        createFakeUser,
      );
      mockRepository.findAllUsers.mockResolvedValue(usersMock);

      expect(await service.findAllUsers()).toEqual({
        message: ESuccess.USERS_FOUND,
        data: usersMock,
      });
    });

    it('should throw NotFoundException if users list is null', async () => {
      mockRepository.findAllUsers.mockResolvedValue(null);
      await expect(service.findAllUsers()).rejects.toThrow(
        new NotFoundException(EErrors.USERS_NOT_FOUND),
      );
    });
  });

  describe('FindOneByUsername', () => {
    const username = 'segundo123';

    it('should return target user wrapped in response DTO', async () => {
      const userMock = createFakeUser(username);
      mockRepository.findOneByUsername.mockResolvedValue(userMock);

      expect(await service.findOneByUsername(username)).toEqual({
        message: ESuccess.USER_FOUND,
        data: userMock,
      });
    });
  });

  describe('DeleteUser', () => {
    const username = 'edilson.segundo';

    it('should return success message upon deletion', async () => {
      mockRepository.findOneByUsername.mockResolvedValue(
        createFakeUser(username),
      );
      mockRepository.deleteUser.mockResolvedValue(ESuccess.DELETE_USER);

      expect(await service.deleteUser(username)).toBe(ESuccess.DELETE_USER);
    });
  });
});
