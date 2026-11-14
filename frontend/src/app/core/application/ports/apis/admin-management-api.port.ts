import { UserEntity } from '../../../domain/entities/user.entity';
import { CreateUserRequest } from '../../models/admin-management.models';

export interface IAdminManagementApiPort {
  listUsers(): Promise<UserEntity[]>;
  createUser(request: CreateUserRequest): Promise<string>;
  resetTemporaryPassword(username: string): Promise<string>;
}
