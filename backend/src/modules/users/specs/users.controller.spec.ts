/* eslint-disable @typescript-eslint/unbound-method */
import { CreateUserDto } from '../dto/create-user.dto';
import { UsersResponseDto } from '../dto/users-response.dto';
import { User } from '../entities/user.entity';
import { ESuccess } from '../enum/success.enum';
import { IUsersService } from '../interface/users.service.interface';
import { UsersController } from '../users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let mockService: jest.Mocked<IUsersService>;

  beforeEach(() => {
    mockService = {
      createUser: jest.fn(),
      updateUserPassword: jest.fn(),
      findAllUsers: jest.fn(),
      findOneByUsername: jest.fn(),
      deleteUser: jest.fn(),
    };
    controller = new UsersController(mockService);
  });

  describe('create', () => {
    it(`should return the message "${ESuccess.USER_REGISTER}", if the user is successfully registered`, async () => {
      const payload: CreateUserDto = {
        username: 'Edilson',
        password: '12345678',
      };
      mockService.createUser.mockResolvedValue(ESuccess.USER_REGISTER);

      const result: string = await controller.createUser(payload);

      expect(result).toBe(ESuccess.USER_REGISTER);
      expect(mockService.createUser).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateUserPassword', () => {
    it(`should return the message ${ESuccess.USERPASSWORD_UPDATE} if the password was successfully updated.`, async () => {
      const username: string = 'edilson.segundo';
      const temporaryPassword: string = '12345678';
      mockService.updateUserPassword.mockResolvedValue(temporaryPassword);

      const result: string = await controller.updateUserPassword(username);

      expect(result).toBe(temporaryPassword);
      expect(mockService.updateUserPassword).toHaveBeenCalledWith(username);
    });
  });

  describe('findAllUsers', () => {
    it('should return the object: { message: string, data: Partial<user>[] | null }', async () => {
      const usersMock: Partial<User>[] = [
        {
          id: 'uuid-0123',
          username: 'segundo123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'uuid-4567',
          username: 'oliveira_dev',
          createdAt: new Date('2026-01-15T10:00:00Z'),
          updatedAt: new Date('2026-05-20T14:30:00Z'),
        },
        {
          id: 'uuid-8910',
          username: 'santos_qa',
          createdAt: new Date('2026-03-01T08:22:00Z'),
          updatedAt: new Date('2026-03-01T08:22:00Z'),
        },
        {
          id: 'uuid-1112',
          username: 'lima_admin',
          createdAt: new Date('2025-12-25T18:00:00Z'),
          updatedAt: new Date('2026-06-10T11:15:00Z'),
        },
      ];
      const response: UsersResponseDto = {
        message: ESuccess.USER_FOUND,
        data: usersMock,
      };
      mockService.findAllUsers.mockResolvedValue(response);

      const result: UsersResponseDto = await controller.findAllUsers();

      expect(result).toEqual(response);
    });
  });

  describe('findOneByUsername', () => {
    it('should return the object: { message: string, data: Partial<User> | null }', async () => {
      const username: string = 'segundo123';
      const userMock: Partial<User> = {
        id: 'uuid-0123',
        username: 'segundo123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const response: UsersResponseDto = {
        message: ESuccess.USER_FOUND,
        data: userMock,
      };
      mockService.findOneByUsername.mockResolvedValue(response);

      const result: UsersResponseDto =
        await controller.findOneByUsername(username);

      expect(result).toEqual(response);
      expect(mockService.findOneByUsername).toHaveBeenCalledWith(username);
    });
  });

  describe('deleteUser', () => {
    it(`It should return the message ${ESuccess.DELETE_USER} if the user is successfully deleted.`, async () => {
      const username: string = 'edilson.segundo';
      mockService.deleteUser.mockResolvedValue(ESuccess.DELETE_USER);

      const result: string = await controller.deleteUser(username);

      expect(result).toBe(ESuccess.DELETE_USER);
      expect(mockService.deleteUser).toHaveBeenCalledWith(username);
    });
  });
});
