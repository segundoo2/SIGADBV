/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from '../roles.controller';
import { IRolesService } from '../interfaces/roles.service.interface';
import { RoleDto } from '../dtos/role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { Role } from '../entities/role.entity';
import { IResponse } from '../../../common/interfaces/response.interface';
import { ERolesSuccess } from '../../../common/enum/roles-success.enum';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

describe('RolesController', () => {
  let controller: RolesController;
  let mockService: jest.Mocked<IRolesService>;

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
    mockService = {
      createRole: jest.fn(),
      findAllRoles: jest.fn(),
      findRoleById: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: 'IRolesService',
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
  });

  describe('createRole', () => {
    it('should call service and return created role response', async () => {
      const response: IResponse<Role> = {
        message: ERolesSuccess.CREATE_ROLE,
        data: mockRole,
      };

      mockService.createRole.mockResolvedValue(response);

      const result = await controller.createRole(roleDto, tenantId);

      expect(result).toEqual(response);
      expect(mockService.createRole).toHaveBeenCalledWith({
        ...roleDto,
        tenantId,
      });
    });
  });

  describe('findAllRoles', () => {
    it('should return paginated list of roles response', async () => {
      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10 };
      const response: IPaginatedResponse<Role | Role[]> = {
        message: ERolesSuccess.ROLES_FOUND,
        data: [mockRole],
        meta: {
          itemCount: 1,
          totalItems: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockService.findAllRoles.mockResolvedValue(
        response as IPaginatedResponse<Role>,
      );

      const result = await controller.findAllRoles(tenantId, paginationQuery);

      expect(result).toEqual(response);
      expect(mockService.findAllRoles).toHaveBeenCalledWith(
        tenantId,
        paginationQuery,
      );
    });
  });

  describe('findRoleById', () => {
    it('should return target role response', async () => {
      const response: IResponse<Role> = {
        message: ERolesSuccess.ROLE_FOUND,
        data: mockRole,
      };

      mockService.findRoleById.mockResolvedValue(response);

      const result = await controller.findRoleById(roleId, tenantId);

      expect(result).toEqual(response);
      expect(mockService.findRoleById).toHaveBeenCalledWith(roleId, tenantId);
    });
  });

  describe('updateRole', () => {
    it('should update role and return success response', async () => {
      const response: IResponse<null> = {
        message: ERolesSuccess.UPDATE_ROLE,
        data: null,
      };

      mockService.updateRole.mockResolvedValue(response);

      const result = await controller.updateRole(
        roleId,
        updateRoleDto,
        tenantId,
      );

      expect(result).toEqual(response);
      expect(mockService.updateRole).toHaveBeenCalledWith(
        roleId,
        tenantId,
        updateRoleDto,
      );
    });
  });

  describe('deleteRole', () => {
    it('should delete target role and return null payload response', async () => {
      const response: IResponse<null> = {
        message: ERolesSuccess.DELETE_ROLE,
        data: null,
      };

      mockService.deleteRole.mockResolvedValue(response);

      const result = await controller.deleteRole(roleId, tenantId);

      expect(result).toEqual(response);
      expect(mockService.deleteRole).toHaveBeenCalledWith(roleId, tenantId);
    });
  });
});
