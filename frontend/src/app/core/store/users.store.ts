import { computed, inject, Injectable, signal } from '@angular/core';
import { UserEntity } from '../domain/entities/user.entity';
import { IUsersStorePort } from '../application/ports/stores/users-store.port';
import { IUpdatePasswordInput } from '../application/models/update-password-input.model';
import { USERS_API_PORT } from '../infra/tokens/users.token';
import { getErrorMessage } from '../application/errors/get-error-message';
import { ICreateUserModel } from '../application/models/create-user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersStore implements IUsersStorePort {
  private readonly usersApi = inject(USERS_API_PORT);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _userCurrentEntity = signal<UserEntity | null>(null);
  private readonly _successMessage = signal<string>('');
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly userCurrentEntity = this._userCurrentEntity.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
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

  createUser(user: ICreateUserModel): Promise<string> {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMessage.set('');

    return this.usersApi
      .createUser(user)
      .then((temporaryPassword) => {
        this._successMessage.set('Usuário criado com sucesso!');
        return temporaryPassword;
      })
      .catch((err: unknown) => {
        this._error.set(getErrorMessage(err));
        throw err;
      })
      .finally(() => {
        this._isLoading.set(false);
      });
  }

  async updatePassword(input: IUpdatePasswordInput): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMessage.set('');

    try {
      await this.usersApi.updatePassword(input);
      this._successMessage.set('Senha atualizada com sucesso.');
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
    } finally {
      this._isLoading.set(false);
    }
  }
}
