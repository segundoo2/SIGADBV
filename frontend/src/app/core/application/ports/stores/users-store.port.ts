import { UserEntity } from '../../../domain/entities/user.entity';

export interface IUsersStorePort {
  readonly userCurrentEntity: () => UserEntity | null;
  readonly error: () => string | null;

  setCurrentUser(user: UserEntity): void;
  clearCurrentUser(): void;
}
