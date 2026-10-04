import { UserEntity } from "./user.entity";

export interface RoleEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly permissions: string[];
  readonly users: UserEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}