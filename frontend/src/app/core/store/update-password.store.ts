import { Injectable, inject, signal } from '@angular/core';
import { IUpdatePasswordInput } from '../application/models/update-password-input.model';
import { UPDATE_PASSWORD_API_PORT } from '../infra/tokens/update-password.token';
import { IUpdatePasswordStorePort } from '../application/ports/stores/update-password-store.port';
import { getErrorMessage } from '../application/errors/get-error-message';

@Injectable()
export class PasswordUpdateStore implements IUpdatePasswordStorePort {
  private readonly passwordApi = inject(UPDATE_PASSWORD_API_PORT);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string>('');

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();

  async updatePassword(input: IUpdatePasswordInput): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMessage.set('');

    try {
      await this.passwordApi.updatePassword(input);
      this._successMessage.set('Senha atualizada com sucesso.');
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
    } finally {
      this._isLoading.set(false);
    }
  }
}
