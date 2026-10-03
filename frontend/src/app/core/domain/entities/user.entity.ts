import { RoleEntity } from './role.entity';

export interface UserEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly username: string;
  readonly password: string;
  readonly mustChangePassword: boolean;
  readonly roles: RoleEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}