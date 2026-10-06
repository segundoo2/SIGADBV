import { computed, Injectable, signal } from '@angular/core';
import { UserEntity } from '../domain/entities/user.entity';
import { IUsersStorePort } from '../application/ports/stores/users-store.port';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserStore implements IUsersStorePort {
  private readonly _userCurrentEntity = signal<UserEntity | null>(null);
  private readonly _error = signal<string | null>(null);

  readonly userCurrentEntity = this._userCurrentEntity.asReadonly();
  readonly error = this._error.asReadonly();

  readonly hasUser = computed(() => this._userCurrentEntity() !== null);
  readonly userRoles = computed(() => this._userCurrentEntity()?.roles ?? []);

  setCurrentUser(user: UserEntity): void {
    this._userCurrentEntity.set(user);
    this._error.set(null);
  }

  clearCurrentUser(): void {
    this._userCurrentEntity.set(null);
    this._error.set(null);
  }
}
