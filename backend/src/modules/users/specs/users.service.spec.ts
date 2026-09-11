/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EUsersSuccess } from '../../../common/enum/users-sucess.enum';
import { IUsersRepository } from '../interfaces/users.repository.interface';
import { UsersService } from '../users.service';
import { EUsersErrors } from '../../../common/enum/users-errors.enum';
import { ERolesErrors } from '../../../common/enum/roles-errors.enum';
import { UpdateResult } from 'typeorm';
import { ICacheStorageService } from '../../../common/redis/interface/cache-storage.interface';
import { IRolesRepository } from '../../roles/interfaces/roles.repository.interface';
import { createFakeUser } from '../../../common/helpers/create-fake-user.helper';
import { Role } from '../../roles/entities/role.entity';
import { ERolesSuccess } from '../../../common/enum/roles-success.enum';
import { User } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockUsersRepository: jest.Mocked<IUsersRepository>;
  let mockRolesRepository: jest.Mocked<IRolesRepository>;
  let mockRedisService: jest.Mocked<ICacheStorageService>;

  const fakeTenantId = 'tenant-uuid-999';
  const roleId = 'c22e5a7d-b2b2-4d76-8809-51a81231f24d';
  const user = createFakeUser();

  const mockRole: Role = {
    id: roleId,
    name: 'ADMIN',
    tenantId: fakeTenantId,
    permissions: [],
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUsersRepository = {
      createUser: jest.fn(),
      updateUserPassword: jest.fn(),
      findAllUsers: jest.fn(),
      findOneByUsername: jest.fn(),
      deleteUser: jest.fn(),
      addRoleToUser: jest.fn(),
      removeRoleFromUser: jest.fn(),
    };

    mockRolesRepository = {
      createRole: jest.fn(),
      findRolesByIds: jest.fn(),
      findAllRoles: jest.fn(),
      findRoleById: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      countUsersWithRole: jest.fn(),
    };

    mockRedisService = {
      setWithExpiry: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    };

    service = new UsersService(
      mockUsersRepository,
      mockRolesRepository,
      mockRedisService,
    );
  });

  describe('createUser', () => {
    const createDto = {
      tenantId: '1',
      username: user.username,
      roleIds: [roleId],
      mustChangePassword: true,
    };

    it('should return success message and password payload upon successful registration', async () => {
      const mockRoles = [{ id: roleId }] as Role[];
      mockRolesRepository.findRolesByIds.mockResolvedValue(mockRoles);

      const result = await service.createUser(createDto);

      expect(result.message).toBe(EUsersSuccess.CREATE_USER);
      expect(result.data).toHaveLength(8);
      expect(mockRolesRepository.findRolesByIds).toHaveBeenCalledWith(
        createDto.roleIds,
        createDto.tenantId,
      );
    });

    it('should throw BadRequestException if any roleId is invalid or not found', async () => {
      mockRolesRepository.findRolesByIds.mockResolvedValue([]);

      await expect(service.createUser(createDto)).rejects.toThrow(
        new BadRequestException(ERolesErrors.ROLE_INVALID),
      );
    });

    it('should forward ConflictException if the repository catches duplicated keys', async () => {
      const mockRoles = [{ id: roleId }] as Role[];
      mockRolesRepository.findRolesByIds.mockResolvedValue(mockRoles);
      mockUsersRepository.createUser.mockRejectedValue(
        new ConflictException(EUsersErrors.USERNAME_EXIST),
      );

      await expect(service.createUser(createDto)).rejects.toThrow(
        new ConflictException(EUsersErrors.USERNAME_EXIST),
      );
    });
  });

  describe('findOneByUsername', () => {
    it('should return targeted single user profile', async () => {
      mockUsersRepository.findOneByUsername.mockResolvedValue(user);

      expect(
        await service.findOneByUsername(user.username, fakeTenantId),
      ).toEqual({ message: EUsersSuccess.USER_FOUND, data: user });
    });

    it('should throw NotFoundException if target profile does not exist', async () => {
      mockUsersRepository.findOneByUsername.mockResolvedValue(null);

      await expect(
        service.findOneByUsername(user.username, fakeTenantId),
      ).rejects.toThrow(new NotFoundException(EUsersErrors.USER_NOT_FOUND));
    });
  });

  describe('findAllUsers', () => {
    it('should return wrapped paginated users payload array with metadata', async () => {
      const users = [user, user] as Omit<User, 'password'>[];
      const pagination = { page: 1, limit: 10 };

      mockUsersRepository.findAllUsers.mockResolvedValue([users, 2]);

      expect(await service.findAllUsers(fakeTenantId, pagination)).toEqual({
        message: EUsersSuccess.USERS_FOUND,
        data: users,
        meta: {
          itemCount: 2,
          totalItems: 2,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      });
      expect(mockUsersRepository.findAllUsers).toHaveBeenCalledWith(
        fakeTenantId,
        pagination,
      );
    });

    it('should throw NotFoundException if repository returns null/empty', async () => {
      mockUsersRepository.findAllUsers.mockResolvedValue([[], 0]);

      await expect(
        service.findAllUsers(fakeTenantId, { page: 1, limit: 10 }),
      ).rejects.toThrow(new NotFoundException(EUsersErrors.USERS_NOT_FOUND));
    });
  });

  describe('updateUserPassword', () => {
    const response: UpdateResult = { raw: [], affected: 1, generatedMaps: [] };
    const baseDto = {
      tenantId: '1',
      username: user.username,
      roleIds: [roleId],
      mustChangePassword: true,
    };

    it('should generate a temporary password if none is provided in the payload', async () => {
      mockUsersRepository.updateUserPassword.mockResolvedValue(response);

      const result = await service.updateUserPassword(baseDto);

      expect(result.message).toBe(EUsersSuccess.PASSWORD_UPDATE);
      expect(result.data).toHaveLength(8);
      expect(mockUsersRepository.updateUserPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          username: user.username,
          password: expect.stringMatching(/^\$2[ayb]\$\d{2}\$/) as string,
        }),
      );
    });

    it('should update successfully and return null data if cleartext password is provided', async () => {
      mockUsersRepository.updateUserPassword.mockResolvedValue(response);

      const result = await service.updateUserPassword({
        ...baseDto,
        password: 'NovaSenhaDefinida123',
      });

      expect(result.message).toBe(EUsersSuccess.PASSWORD_UPDATE);
      expect(result.data).toBeNull();
    });

    it('should throw NotFoundException when affected rows count is zero', async () => {
      mockUsersRepository.updateUserPassword.mockResolvedValue({
        ...response,
        affected: 0,
      });

      await expect(service.updateUserPassword(baseDto)).rejects.toThrow(
        new NotFoundException(EUsersErrors.USER_NOT_FOUND),
      );
    });
  });

  describe('addRoleToUser', () => {
    it('should add role to user successfully', async () => {
      const userWithoutRole = { ...user, roles: [] };
      mockUsersRepository.findOneByUsername.mockResolvedValue(userWithoutRole);
      mockRolesRepository.findRoleById.mockResolvedValue(mockRole);
      mockUsersRepository.addRoleToUser.mockResolvedValue(undefined);

      const result = await service.addRoleToUser(user.id, roleId, fakeTenantId);

      expect(result).toEqual({
        message: ERolesSuccess.ROLE_ADDED,
        data: null,
      });
      expect(mockUsersRepository.addRoleToUser).toHaveBeenCalledWith(
        user.id,
        roleId,
        fakeTenantId,
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersRepository.findOneByUsername.mockResolvedValue(null);

      await expect(
        service.addRoleToUser(user.id, roleId, fakeTenantId),
      ).rejects.toThrow(new NotFoundException(EUsersErrors.USER_NOT_FOUND));
    });

    it('should throw NotFoundException if role is not found', async () => {
      mockUsersRepository.findOneByUsername.mockResolvedValue({
        ...user,
        roles: [],
      });
      mockRolesRepository.findRoleById.mockResolvedValue(null);

      await expect(
        service.addRoleToUser(user.id, roleId, fakeTenantId),
      ).rejects.toThrow(new NotFoundException(ERolesErrors.ROLE_NOT_FOUND));
    });

    it('should throw ConflictException if user already has the role', async () => {
      const userWithRole = { ...user, roles: [mockRole] };
      mockUsersRepository.findOneByUsername.mockResolvedValue(userWithRole);
      mockRolesRepository.findRoleById.mockResolvedValue(mockRole);

      await expect(
        service.addRoleToUser(user.id, roleId, fakeTenantId),
      ).rejects.toThrow(
        new ConflictException(EUsersErrors.USER_ALREADY_HAS_ROLE),
      );
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user successfully', async () => {
      const userWithRole = { ...user, roles: [mockRole] };
      mockUsersRepository.findOneByUsername.mockResolvedValue(userWithRole);
      mockUsersRepository.removeRoleFromUser.mockResolvedValue(undefined);

      const result = await service.removeRoleFromUser(
        user.id,
        roleId,
        fakeTenantId,
      );

      expect(result).toEqual({
        message: ERolesSuccess.ROLE_REMOVED,
        data: null,
      });
      expect(mockUsersRepository.removeRoleFromUser).toHaveBeenCalledWith(
        user.id,
        roleId,
        fakeTenantId,
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersRepository.findOneByUsername.mockResolvedValue(null);

      await expect(
        service.removeRoleFromUser(user.id, roleId, fakeTenantId),
      ).rejects.toThrow(new NotFoundException(EUsersErrors.USER_NOT_FOUND));
    });

    it('should throw NotFoundException if user does not have the role', async () => {
      const userWithoutRole = { ...user, roles: [] };
      mockUsersRepository.findOneByUsername.mockResolvedValue(userWithoutRole);

      await expect(
        service.removeRoleFromUser(user.id, roleId, fakeTenantId),
      ).rejects.toThrow(
        new NotFoundException(EUsersErrors.USER_DOES_NOT_HAVE_ROLE),
      );
    });
  });

  describe('deleteUser', () => {
    it('should purge record and set structural temporary expiration blacklist item inside Redis', async () => {
      mockUsersRepository.findOneByUsername.mockResolvedValue(user);
      mockUsersRepository.deleteUser.mockResolvedValue({
        raw: [],
        affected: 1,
      });
      mockRedisService.setWithExpiry.mockResolvedValue(undefined);

      expect(await service.deleteUser(user.username, fakeTenantId)).toEqual({
        message: EUsersSuccess.DELETE_USER,
        data: null,
      });
      expect(mockRedisService.setWithExpiry).toHaveBeenCalledWith(
        `blacklist:user:${user.id}`,
        'deleted',
        900,
      );
    });

    it('should throw NotFoundException if entity missing before execution steps', async () => {
      mockUsersRepository.findOneByUsername.mockResolvedValue(null);

      await expect(
        service.deleteUser(user.username, fakeTenantId),
      ).rejects.toThrow(new NotFoundException(EUsersErrors.USER_NOT_FOUND));
    });
  });
});
