export interface RoleEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly permissions: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
