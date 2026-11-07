/* eslint-disable @typescript-eslint/unbound-method */
import { createFakeUser } from '../../../common/helpers/create-fake-user.helper';
import { IResponse } from '../../../common/interfaces/response.interface';
import { UserDto } from '../dtos/user.dto';
import { User } from '../entities/user.entity';
import { EUsersSuccess } from '../../../common/enum/user/users-sucess.enum';
import { IUsersService } from '../interfaces/users.service.interface';
import { UsersController } from '../users.controller';
import { ERolesSuccess } from '../../../common/enum/role/roles-success.enum';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';

describe('UsersController', () => {
  let controller: UsersController;
  let mockService: jest.Mocked<IUsersService>;

  const user = createFakeUser();
  const tenantId = '1';
  const roleId = 'c22e5a7d-b2b2-4d76-8809-51a81231f24d';

  beforeEach(() => {
    mockService = {
      createUser: jest.fn(),
      updateOwnPassword: jest.fn(),
      resetTemporaryPassword: jest.fn(),
      findAllUsers: jest.fn(),
      findOneByUsername: jest.fn(),
      deleteUser: jest.fn(),
      addRoleToUser: jest.fn(),
      removeRoleFromUser: jest.fn(),
    };
    controller = new UsersController(mockService);
  });

  describe('createUser', () => {
    it('should forward response data context directly from service layer', async () => {
      const response: IResponse<{ temporaryPassword: string }> = {
        message: EUsersSuccess.CREATE_USER,
        data: { temporaryPassword: '1234567890ab' },
      };
      const userDto: UserDto & {
        tenantId: string;
        mustChangePassword: boolean;
      } = {
        username: user.username,
        tenantId,
        mustChangePassword: true,
        roleIds: [roleId],
      };

      mockService.createUser.mockResolvedValue(response);

      expect(await controller.createUser(userDto, tenantId)).toEqual(response);
      expect(mockService.createUser).toHaveBeenCalledWith(userDto);
    });
  });

  describe('findOneByUsername', () => {
    it('should query specific user matching parameters context structures', async () => {
      const response: IResponse<Omit<User, 'password'>> = {
        message: EUsersSuccess.USER_FOUND,
        data: user,
      };
      mockService.findOneByUsername.mockResolvedValue(response);

      expect(
        await controller.findOneByUsername(user.username, tenantId),
      ).toEqual(response);
      expect(mockService.findOneByUsername).toHaveBeenCalledWith(
        user.username,
        tenantId,
      );
    });
  });

  describe('findAllUsers', () => {
    it('should load list wrapped output schemas properly with meta data', async () => {
      const usersMock = [createFakeUser(), createFakeUser()] as Omit<
        User,
        'password'
      >[];
      const pagination = { page: 1, limit: 10 };
      const response: IPaginatedResponse<Omit<User, 'password'>[]> = {
        message: EUsersSuccess.USERS_FOUND,
        data: usersMock,
        meta: {
          itemCount: 2,
          totalItems: 2,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockService.findAllUsers.mockResolvedValue(response);

      expect(await controller.findAllUsers(tenantId, pagination)).toEqual(
        response,
      );
      expect(mockService.findAllUsers).toHaveBeenCalledWith(
        tenantId,
        pagination,
      );
    });
  });

  describe('updateUserPassword', () => {
    it('should return corresponding payload details containing update responses', async () => {
      const response: IResponse<null> = {
        message: EUsersSuccess.PASSWORD_UPDATE,
        data: null,
      };
      const currentUser: IJwtPayload = {
        sub: user.id,
        tenantId,
        username: user.username,
        roles: [],
        permissions: [],
        fingerprint: 'test-device',
      };
      const passwordDto = { password: 'NovaSenha12' };

      mockService.updateOwnPassword.mockResolvedValue(response);

      expect(
        await controller.updateUserPassword(currentUser, passwordDto),
      ).toEqual(response);
      expect(mockService.updateOwnPassword).toHaveBeenCalledWith(
        currentUser.sub,
        currentUser.tenantId,
        passwordDto,
      );
    });
  });

  describe('resetTemporaryPassword', () => {
    it('should forward the target username and tenant for authorized reset', async () => {
      const response: IResponse<{ temporaryPassword: string }> = {
        message: EUsersSuccess.PASSWORD_UPDATE,
        data: { temporaryPassword: 'a1b2c3d4e5f6' },
      };
      mockService.resetTemporaryPassword.mockResolvedValue(response);

      expect(
        await controller.resetTemporaryPassword(user.username, tenantId),
      ).toEqual(response);
      expect(mockService.resetTemporaryPassword).toHaveBeenCalledWith(
        user.username,
        tenantId,
      );
    });
  });

  describe('addRoleToUser', () => {
    it('should call service and return success response', async () => {
      const response: IResponse<null> = {
        message: ERolesSuccess.ROLE_ADDED,
        data: null,
      };
      mockService.addRoleToUser.mockResolvedValue(response);

      expect(await controller.addRoleToUser(user.id, roleId, tenantId)).toEqual(
        response,
      );
      expect(mockService.addRoleToUser).toHaveBeenCalledWith(
        user.id,
        roleId,
        tenantId,
      );
    });
  });

  describe('removeRoleFromUser', () => {
    it('should call service and return success response', async () => {
      const response: IResponse<null> = {
        message: ERolesSuccess.ROLE_REMOVED,
        data: null,
      };
      mockService.removeRoleFromUser.mockResolvedValue(response);

      expect(
        await controller.removeRoleFromUser(user.id, roleId, tenantId),
      ).toEqual(response);
      expect(mockService.removeRoleFromUser).toHaveBeenCalledWith(
        user.id,
        roleId,
        tenantId,
      );
    });
  });

  describe('deleteUser', () => {
    it('should perform deletion operation forwarding dynamic statuses', async () => {
      const response: IResponse<null> = {
        message: EUsersSuccess.DELETE_USER,
        data: null,
      };
      mockService.deleteUser.mockResolvedValue(response);

      expect(await controller.deleteUser(user.username, tenantId)).toEqual(
        response,
      );
      expect(mockService.deleteUser).toHaveBeenCalledWith(
        user.username,
        tenantId,
      );
    });
  });
});
