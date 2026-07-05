import { UserDto } from '../dto/user.dto';
import { UsersResponseDto } from '../dto/users-response.dto';
import { User } from '../entities/user.entity';
import { ESuccess } from '../enum/success.enum';
import { createFakeUser } from '../helpers/create-fake-user.helper';
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

  const user = createFakeUser();

  describe('create', () => {
    const response: UsersResponseDto = {
      message: ESuccess.CREATE_USER,
      data: '12345678',
    };
    it(`should return the object { message: string, data: string }, if the user is successfully registered`, async () => {
      const userDto: UserDto = { username: user.username as string };
      mockService.createUser.mockResolvedValue(response);

      expect(await controller.createUser(userDto)).toEqual(response);
      expect(mockService.createUser).toHaveBeenCalledWith(userDto);
    });
  });

  describe('updateUserPassword', () => {
    user.password = '12345678';
    const response: UsersResponseDto = {
      message: ESuccess.PASSWORD_UPDATE,
      data: user.password,
    };
    const userDto: UserDto = {
      username: user.username as string,
      password: user.password,
    };

    it(`should return the message ${ESuccess.PASSWORD_UPDATE} if the temporary password was successfully updated.`, async () => {
      userDto.password = undefined;
      mockService.updateUserPassword.mockResolvedValue(response);

      expect(await controller.updateUserPassword(userDto)).toBe(response);
      expect(mockService.updateUserPassword).toHaveBeenCalledWith(userDto);
    });

    it(`should return the message ${ESuccess.PASSWORD_UPDATE} if the user password was successfully updated.`, async () => {
      mockService.updateUserPassword.mockResolvedValue(response);

      expect(await controller.updateUserPassword(userDto)).toEqual(response);
      expect(mockService.updateUserPassword).toHaveBeenCalledWith(userDto);
    });
  });

  describe('findAllUsers', () => {
    it('should return the object: { message: string, data: Partial<user>[] | null }', async () => {
      const usersMock: Partial<User>[] = [
        createFakeUser(),
        createFakeUser(),
        createFakeUser(),
      ];
      const response: UsersResponseDto = {
        message: ESuccess.USER_FOUND,
        data: usersMock,
      };
      mockService.findAllUsers.mockResolvedValue(response);
      expect(await controller.findAllUsers()).toEqual(response);
    });
  });

  describe('findOneByUsername', () => {
    it('should return the object: { message: string, data: Partial<User> }', async () => {
      const response: UsersResponseDto = {
        message: ESuccess.USER_FOUND,
        data: user,
      };
      mockService.findOneByUsername.mockResolvedValue(response);
      expect(
        await controller.findOneByUsername(user.username as string),
      ).toEqual(response);
      expect(mockService.findOneByUsername).toHaveBeenCalledWith(user.username);
    });
  });

  describe('deleteUser', () => {
    it(`It should return the message ${ESuccess.DELETE_USER} if the user is successfully deleted.`, async () => {
      mockService.deleteUser.mockResolvedValue(ESuccess.DELETE_USER);
      expect(await controller.deleteUser(user.username as string)).toBe(
        ESuccess.DELETE_USER,
      );
      expect(mockService.deleteUser).toHaveBeenCalledWith(user.username);
    });
  });
});
