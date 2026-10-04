import { Injectable, inject, signal } from '@angular/core';
import { AUTH_API_PORT } from '../infra/tokens/auth.token';
import { IAuthCredentialsModel } from '../domain/models/auth-credentials.model';
import { EErrorsGlobal } from '../domain/enums/errors-global.enum';
import { IAuthStorePort } from '../domain/ports/stores/auth-store.port';
import { USERS_STORE_PORT } from '../infra/tokens/users.token';

@Injectable({
  providedIn: 'root',
})
export class AuthStore implements IAuthStorePort {
  private readonly authApiPort = inject(AUTH_API_PORT);
  private readonly usersStore = inject(USERS_STORE_PORT);

  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _mustChangePassword = signal<boolean>(false);
  private readonly _currentUsername = signal<string>('');

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly mustChangePassword = this._mustChangePassword.asReadonly();
  readonly currentUsername = this._currentUsername.asReadonly();

  async login(credentials: IAuthCredentialsModel): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await this.authApiPort.login(credentials);

      this._currentUsername.set(credentials.username);
      this._mustChangePassword.set(response.mustChangePassword);
      this._isAuthenticated.set(true);

      if (response.data) {
        this.usersStore.setCurrentUser(response.data.user);
      }

      return true;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : EErrorsGlobal.SERVER_ERROR;

      this._isAuthenticated.set(false);
      this._error.set(errorMessage);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  async checkSession(): Promise<void> {
    this._isLoading.set(true);
    try {
      const response = await this.authApiPort.refresh();
      this._isAuthenticated.set(true);
      this._mustChangePassword.set(response.mustChangePassword);

      if (response.data && 'user' in response.data && response.data.user) {
        this.usersStore.setCurrentUser(response.data.user);
      }
    } catch {
      this._isAuthenticated.set(false);
      this._mustChangePassword.set(false);
      this.usersStore.clearSelectedUser();
    } finally {
      this._isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.authApiPort.logout();
    } finally {
      this._isAuthenticated.set(false);
      this._mustChangePassword.set(false);
      this._currentUsername.set('');
      this._error.set(null);
      this._isLoading.set(false);
      this.usersStore.clearSelectedUser();
    }
  }
}
