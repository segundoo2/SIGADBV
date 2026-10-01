import { Injectable, inject, signal } from '@angular/core';
import { IResponseModel } from '../domain/models/response.model';
import { IUpdatePasswordDto } from '../domain/models/update-password-dto.model';
import { UPDATE_PASSWORD_API_PORT } from '../infra/tokens/update-password.token';
import { IUpdatePasswordStorePort } from '../domain/ports/stores/update-password-store.port';
import { getApiErrorMessage } from '../infra/interceptors/api-error-message.helper';

@Injectable()
export class UpdatePasswordStore implements IUpdatePasswordStorePort {
  private readonly api = inject(UPDATE_PASSWORD_API_PORT);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string>('');

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();

  async updatePassword(
    updatePassword: IUpdatePasswordDto,
  ): Promise<IResponseModel<null>> {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMessage.set('');

    try {
      const response = await this.api.updatePassword(updatePassword);
      this._successMessage.set(response.message);
      return response;
    } catch (err: unknown) {
      const errorMessage = getApiErrorMessage(err);
      this._error.set(errorMessage);

      return {
        message: errorMessage,
        data: null,
      };
    } finally {
      this._isLoading.set(false);
    }
  }
}
