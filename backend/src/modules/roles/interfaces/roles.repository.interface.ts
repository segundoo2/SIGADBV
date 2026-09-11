import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { RoleDto } from '../dtos/role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { Role } from '../entities/role.entity';
import { DeleteResult, UpdateResult } from 'typeorm';

export interface IRolesRepository {
  createRole(roleDto: RoleDto): Promise<Role>;

  findRoleById(id: string, tenantId: string): Promise<Role | null>;

  findAllRoles(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<[Role[], number]>;

  findRolesByIds(ids: string[], tenantId: string): Promise<Role[]>;

  updateRole(
    id: string,
    tenantId: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<UpdateResult>;

  deleteRole(id: string, tenantId: string): Promise<DeleteResult>;

  countUsersWithRole(roleId: string, tenantId: string): Promise<number>;
}
