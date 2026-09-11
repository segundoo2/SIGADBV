import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  DeleteResult,
  In,
  ObjectLiteral,
  QueryFailedError,
  Repository,
  UpdateResult,
} from 'typeorm';
import { RolesRepository } from '../roles.repository';
import { Role } from '../entities/role.entity';
import { RoleDto } from '../dtos/role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { ERolesErrors } from '../../../common/enum/roles-errors.enum';
import { EErrorsGlobal } from '../../../common/enum/errors-global.enum';
import { IDatabaseDriverError } from '../../../common/interfaces/database-driver-Error.interface';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('RolesRepository', () => {
  let repository: RolesRepository;
  let ormRepositoryMock: MockRepository<Role>;

  const tenantId = 'tenant-uuid-123';
  const roleId = 'role-uuid-456';

  const mockRole: Role = {
    id: roleId,
    name: 'ADMIN',
    tenantId,
    permissions: [],
    users: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const roleDto: RoleDto = {
    tenantId,
    name: 'ADMIN',
    permissions: [],
  };

  const updateRoleDto: UpdateRoleDto = {
    name: 'SUPER_ADMIN',
  };

  beforeEach(async () => {
    const mockFactory = (): MockRepository<Role> => ({
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesRepository,
        {
          provide: getRepositoryToken(Role),
          useFactory: mockFactory,
        },
      ],
    }).compile();

    repository = module.get<RolesRepository>(RolesRepository);
    ormRepositoryMock = module.get<MockRepository<Role>>(
      getRepositoryToken(Role),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const shouldHandleDatabaseErrors = (
    operation: () => Promise<unknown>,
    mockMethod: () => jest.Mock | undefined,
  ) => {
    it('should throw InternalServerErrorException when TypeORM operation fails', async () => {
      mockMethod()?.mockRejectedValue(new Error('Database error'));

      await expect(operation()).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  };

  describe('createRole', () => {
    it('should create and save a new role', async () => {
      ormRepositoryMock.create?.mockReturnValue(mockRole);
      ormRepositoryMock.save?.mockResolvedValue(mockRole);

      const result = await repository.createRole(roleDto);

      expect(result).toEqual(mockRole);
      expect(ormRepositoryMock.create).toHaveBeenCalledWith(roleDto);
      expect(ormRepositoryMock.save).toHaveBeenCalledWith(mockRole);
    });

    it('should throw ConflictException on duplicate key violation (23505)', async () => {
      ormRepositoryMock.create?.mockReturnValue(mockRole);

      const driverError: IDatabaseDriverError = Object.assign(
        new Error('Duplicate key'),
        { code: '23505' },
      );
      const queryError = new QueryFailedError('SELECT 1', [], driverError);

      ormRepositoryMock.save?.mockRejectedValue(queryError);

      await expect(repository.createRole(roleDto)).rejects.toThrow(
        new ConflictException(ERolesErrors.ROLE_EXIST),
      );
    });

    shouldHandleDatabaseErrors(
      () => repository.createRole(roleDto),
      () => ormRepositoryMock.save,
    );
  });

  describe('findAllRoles', () => {
    const pagination: PaginationQueryDto = { page: 1, limit: 10 };

    it('should return tuple [Role[], number] when records match tenant', async () => {
      const rolesList: [Role[], number] = [[mockRole], 1];
      ormRepositoryMock.findAndCount?.mockResolvedValue(rolesList);

      const result = await repository.findAllRoles(tenantId, pagination);

      expect(result).toEqual(rolesList);
      expect(ormRepositoryMock.findAndCount).toHaveBeenCalledWith({
        where: { tenantId },
        skip: 0,
        take: 10,
      });
    });

    shouldHandleDatabaseErrors(
      () => repository.findAllRoles(tenantId, pagination),
      () => ormRepositoryMock.findAndCount,
    );
  });

  describe('findRoleById', () => {
    it('should return role entity if present in database', async () => {
      ormRepositoryMock.findOne?.mockResolvedValue(mockRole);

      const result = await repository.findRoleById(roleId, tenantId);

      expect(result).toEqual(mockRole);
      expect(ormRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: roleId, tenantId },
      });
    });

    it('should return null if role is absent', async () => {
      ormRepositoryMock.findOne?.mockResolvedValue(null);

      const result = await repository.findRoleById(roleId, tenantId);

      expect(result).toBeNull();
    });

    shouldHandleDatabaseErrors(
      () => repository.findRoleById(roleId, tenantId),
      () => ormRepositoryMock.findOne,
    );
  });

  describe('findRolesByIds', () => {
    it('should return list of matching roles using In operator', async () => {
      const ids = [roleId];
      ormRepositoryMock.find?.mockResolvedValue([mockRole]);

      const result = await repository.findRolesByIds(ids, tenantId);

      expect(result).toEqual([mockRole]);
      expect(ormRepositoryMock.find).toHaveBeenCalledWith({
        where: { id: In(ids), tenantId },
      });
    });

    shouldHandleDatabaseErrors(
      () => repository.findRolesByIds([roleId], tenantId),
      () => ormRepositoryMock.find,
    );
  });

  describe('updateRole', () => {
    const response: UpdateResult = { raw: [], affected: 1, generatedMaps: [] };

    it('should update role properties successfully', async () => {
      ormRepositoryMock.update?.mockResolvedValue(response);

      const result = await repository.updateRole(
        roleId,
        tenantId,
        updateRoleDto,
      );

      expect(result).toEqual(response);
      expect(ormRepositoryMock.update).toHaveBeenCalledWith(
        { id: roleId, tenantId },
        updateRoleDto,
      );
    });

    shouldHandleDatabaseErrors(
      () => repository.updateRole(roleId, tenantId, updateRoleDto),
      () => ormRepositoryMock.update,
    );
  });

  describe('deleteRole', () => {
    const response: DeleteResult = { raw: [], affected: 1 };

    it('should perform deletion operation based on id and tenantId', async () => {
      ormRepositoryMock.delete?.mockResolvedValue(response);

      const result = await repository.deleteRole(roleId, tenantId);

      expect(result).toEqual(response);
      expect(ormRepositoryMock.delete).toHaveBeenCalledWith({
        id: roleId,
        tenantId,
      });
    });

    shouldHandleDatabaseErrors(
      () => repository.deleteRole(roleId, tenantId),
      () => ormRepositoryMock.delete,
    );
  });
});
