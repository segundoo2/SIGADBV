export interface CreateUserRequest {
  readonly username: string;
  readonly roleIds: readonly string[];
}

export interface CreateRoleRequest {
  readonly name: string;
  readonly permissions: readonly string[];
}
