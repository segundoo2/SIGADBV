import { RoleEntity } from '../../../domain/entities/role.entity';
import { CreateRoleRequest } from '../../models/admin-management.models';

export interface IRolesApiPort {
  listRoles(): Promise<RoleEntity[]>;
  listPermissions(): Promise<string[]>;
  createRole(request: CreateRoleRequest): Promise<void>;
}
