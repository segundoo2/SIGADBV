import { UserEntity } from '../../../domain/entities/user.entity';
import { ICreateUserModel } from '../../models/create-user.model';
import { IUpdatePasswordInput } from '../../models/update-password-input.model';

export interface IUsersApiPort {
  createUser(username: ICreateUserModel): Promise<string>;
  getAllUsers(): Promise<UserEntity[]>;
  getUserByUsername(user: string, tenantId: string): Promise<UserEntity>;
  generateTemporaryPassword(
    username: string,
    tenantId: string,
  ): Promise<string>;
  updatePassword(input: IUpdatePasswordInput): Promise<void>;
  addUserRole(username: string, tenantId: string, role: string): Promise<void>;
  removeUserRole(
    username: string,
    tenantId: string,
    role: string,
  ): Promise<void>;
  deleteUserByUsername(username: string, tenantId: string): Promise<void>;
}
