import { UserEntity } from '../../../domain/entities/user.entity';
import { IUpdatePasswordInput } from '../../models/update-password-input.model';

export interface IUsersStorePort {
  readonly isLoading: () => boolean;
  readonly userCurrentEntity: () => UserEntity | null;
  readonly successMessage: () => string;
  readonly error: () => string | null;

  setCurrentUser(user: UserEntity): void;
  clearCurrentUser(): void;

  createUser(user: UserEntity): Promise<UserEntity>;
  getAllUsers(): Promise<UserEntity[]>;
  getUserByUsername(username: string, tenantId: string): Promise<UserEntity>;
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
