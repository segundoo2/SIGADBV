import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { EPermission } from '../enum/permissions.enum';

export function createFakeUser(): User {
  const role = new Role();
  role.id = 'role-uuid-123';
  role.name = 'Admin';
  role.tenantId = 'tenant-uuid-123';
  role.permissions = [EPermission.USERS_READ, EPermission.USERS_CREATE];
  role.users = [];
  role.createdAt = new Date();
  role.updatedAt = new Date();

  const user = new User();
  user.id = 'user-uuid-123';
  user.username = 'john.doe';
  user.password = '$2b$10$hashFakePassword1234567890';
  user.tenantId = 'tenant-uuid-123';
  user.mustChangePassword = false;
  user.roles = [role];
  user.createdAt = new Date();
  user.updatedAt = new Date();

  return user;
}
