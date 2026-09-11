import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { RoleDto } from '../dtos/role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { Role } from '../entities/role.entity';

export interface IRolesController {
  createRole(roleDto: RoleDto, tenantId: string): Promise<IResponse<Role>>;

  findRoleById(id: string, tenantId: string): Promise<IResponse<Role>>;

  findAllRoles(
    tenantId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Role>>;

  updateRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
    tenantId: string,
  ): Promise<IResponse<null>>;

  deleteRole(id: string, tenantId: string): Promise<IResponse<null>>;
}
