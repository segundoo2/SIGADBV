import { Injectable, inject, signal } from '@angular/core';
import { AUTH_API_PORT } from '../infra/tokens/auth.token';
import { IAuthCredentialsModel } from '../application/models/auth-credentials.model';
import { IAuthStorePort } from '../application/ports/stores/auth-store.port';
import { USERS_STORE_PORT } from '../infra/tokens/users.token';
import { getErrorMessage } from '../application/errors/get-error-message';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationStore implements IAuthStorePort {
  private readonly authApiPort = inject(AUTH_API_PORT);
  private readonly usersStore = inject(USERS_STORE_PORT);

  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _mustChangePassword = signal<boolean>(false);
  private sessionCheckPromise: Promise<void> | null = null;

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly mustChangePassword = this._mustChangePassword.asReadonly();
  readonly currentUserEntity = this.usersStore.userCurrentEntity;

  async login(credentials: IAuthCredentialsModel): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await this.authApiPort.login(credentials);

      this._mustChangePassword.set(response.mustChangePassword);
      this._isAuthenticated.set(true);

      this.usersStore.setCurrentUser(response.user);

      return true;
    } catch (err: unknown) {
      this._isAuthenticated.set(false);
      this._error.set(getErrorMessage(err));
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  restoreAuthenticationSession(): Promise<void> {
    if (this.sessionCheckPromise) {
      return this.sessionCheckPromise;
    }

    this._isLoading.set(true);
    this.sessionCheckPromise = this.restoreSession();
    return this.sessionCheckPromise;
  }

  private async restoreSession(): Promise<void> {
    try {
      const response = await this.authApiPort.refresh();
      this._isAuthenticated.set(true);
      this._mustChangePassword.set(response.mustChangePassword);

      this.usersStore.setCurrentUser(response.user);
    } catch {
      this._isAuthenticated.set(false);
      this._mustChangePassword.set(false);
      this.usersStore.clearCurrentUser();
    } finally {
      this._isLoading.set(false);
      this.sessionCheckPromise = null;
    }
  }

  async logout(): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.authApiPort.logout();
    } finally {
      this._isAuthenticated.set(false);
      this._mustChangePassword.set(false);
      this._error.set(null);
      this._isLoading.set(false);
      this.usersStore.clearCurrentUser();
    }
  }
}
