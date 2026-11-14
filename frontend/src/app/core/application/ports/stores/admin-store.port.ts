import { RoleEntity } from '../../../domain/entities/role.entity';
import { UserEntity } from '../../../domain/entities/user.entity';
import {
  CreateRoleRequest,
  CreateUserRequest,
} from '../../models/admin-management.models';

export type AdminModal =
  'create-user' | 'create-role' | 'temporary-password' | null;

export interface AdminDataAccess {
  readonly canReadUsers: boolean;
  readonly canReadRoles: boolean;
  readonly canCreateRoles: boolean;
}

export interface IAdminStorePort {
  readonly users: () => UserEntity[];
  readonly roles: () => RoleEntity[];
  readonly permissions: () => string[];
  readonly isLoading: () => boolean;
  readonly error: () => string | null;
  readonly modal: () => AdminModal;
  readonly temporaryPassword: () => string | null;
  readonly selectedPermissions: () => string[];
  readonly isUserSaving: () => boolean;
  readonly isRoleSaving: () => boolean;

  loadData(access: AdminDataAccess): Promise<void>;
  openCreateUser(): void;
  openCreateRole(): void;
  closeModal(): void;
  togglePermission(permission: string, checked: boolean): void;
  resetTemporaryPassword(username: string): Promise<void>;
  createUser(request: CreateUserRequest): Promise<void>;
  createRole(request: CreateRoleRequest): Promise<void>;
}
