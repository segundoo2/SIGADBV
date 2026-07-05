import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ESuccess } from '../enum/success.enum';
import { IUsersRepository } from '../interface/users.repository.interface';
import { UsersService } from '../users.service';
import { EErrors } from '../enum/errors.enum';
import { User } from '../entities/user.entity';
import { DeleteResult, UpdateResult } from 'typeorm';
import { createFakeUser } from '../helpers/create-fake-user.helper';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: jest.Mocked<IUsersRepository>;

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

  describe('Shared Username Validation Guard', () => {
    it.each([
      { label: 'undefined', value: undefined as unknown as string },
      { label: 'empty string', value: '' },
      { label: 'only spaces', value: '   ' },
    ])(
      'should throw BadRequestException if username is $label',
      async ({ value }) => {
        await expect(
          service.updateUserPassword({ username: value }),
        ).rejects.toThrow(new BadRequestException(EErrors.USERNAME_INVALID));
        await expect(service.findOneByUsername(value)).rejects.toThrow(
          new BadRequestException(EErrors.USERNAME_INVALID),
        );
        await expect(service.deleteUser(value)).rejects.toThrow(
          new BadRequestException(EErrors.USERNAME_INVALID),
        );
      },
    );
  });

  const user = createFakeUser();

  describe('createUser', () => {
    it('should return success message if the user is successfully registered', async () => {
      user.password = '12345678';
      const result = await service.createUser({
        username: user.username as string,
      });

      expect(result.message).toBe(ESuccess.CREATE_USER);
      expect(typeof result.data).toBe('string');
      expect(result.data).toHaveLength(8);
    });

    it('should throw ConflictException if the username is already registered', async () => {
      mockRepository.findOneByUsername.mockResolvedValue(createFakeUser());
      await expect(
        service.createUser({ username: user.username as string }),
      ).rejects.toThrow(new ConflictException(EErrors.USERNAME_EXIST));
    });
  });

  describe('updateUserPassword', () => {
    const response: UpdateResult = {
      raw: [],
      affected: 1,
      generatedMaps: [],
    };

    // Cenário 1: Quando NENHUMA senha é enviada (Geração de senha temporária)
    it('should generate and return a temporary password if no password is provided in DTO', async () => {
      mockRepository.updateUserPassword.mockResolvedValue(response);

      const result = await service.updateUserPassword({
        username: user.username as string,
      });

      expect(result.message).toBe(ESuccess.PASSWORD_UPDATE);
      expect(typeof result.data).toBe('string');
      expect(result.data).toHaveLength(8);

      expect(mockRepository.updateUserPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          username: user.username,
          password: expect.stringMatching(/^\$2[ayb]\$\d{2}\$/) as string,
        }),
      );
    });

    // Cenário 2: Quando UMA senha já é enviada no DTO (Apenas atualiza e retorna null)
    it('should update successfully and return data as null if a password is provided in DTO', async () => {
      mockRepository.updateUserPassword.mockResolvedValue(response);

      const result = await service.updateUserPassword({
        username: user.username as string,
        password: 'NovaSenhaDefinida123',
      });

      expect(result.message).toBe(ESuccess.PASSWORD_UPDATE);
      expect(result.data).toBeNull();

      expect(mockRepository.updateUserPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          username: user.username,
          password: expect.stringMatching(/^\$2[ayb]\$\d{2}\$/) as string,
        }),
      );
    });

    it('should return the NotFoundException when the user not exist', async () => {
      response.affected = 0;
      mockRepository.updateUserPassword.mockResolvedValue(response);

      await expect(
        service.updateUserPassword({ username: user.username as string }),
      ).rejects.toThrow(new NotFoundException(EErrors.USER_NOT_FOUND));
    });
  });

  describe('findAllUsers', () => {
    const users: Partial<User>[] = [user, user, user];

    it('should return users response list payload', async () => {
      mockRepository.findAllUsers.mockResolvedValue(users);
      expect(await service.findAllUsers()).toEqual({
        message: ESuccess.USERS_FOUND,
        data: users,
      });
    });

    it('should throw NotFoundException if users list is null', async () => {
      mockRepository.findAllUsers.mockResolvedValue(null);
      await expect(service.findAllUsers()).rejects.toThrow(
        new NotFoundException(EErrors.USERS_NOT_FOUND),
      );
    });
  });

  describe('findOneByUsername', () => {
    it('should return target user wrapped in response DTO', async () => {
      mockRepository.findOneByUsername.mockResolvedValue(user);
      expect(await service.findOneByUsername(user.username as string)).toEqual({
        message: ESuccess.USER_FOUND,
        data: user,
      });
    });
  });

  describe('deleteUser', () => {
    const response: DeleteResult = { raw: [], affected: 1 };

    it('should return success message upon deletion', async () => {
      mockRepository.deleteUser.mockResolvedValue(response);
      expect(await service.deleteUser(user.username as string)).toBe(
        ESuccess.DELETE_USER,
      );
    });

    it('should return the NotFoundException when the user not exist', async () => {
      response.affected = 0;
      mockRepository.deleteUser.mockResolvedValue(response);
      await expect(service.deleteUser(user.username as string)).rejects.toThrow(
        new NotFoundException(EErrors.USER_NOT_FOUND),
      );
    });
  });
});
