import { Signal } from '@angular/core';
import { UserEntity } from '../../entities/user.entity';

export interface IUsersStorePort {
  readonly userCurrentEntity: Signal<UserEntity | null>;
  readonly error: Signal<string | null>;

  setCurrentUser(user: UserEntity): void;
  clearSelectedUser(): void;
}