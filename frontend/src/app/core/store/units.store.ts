import { Injectable, inject, signal } from '@angular/core';
import { IUnitEntity } from '../domain/entities/unit.entity';
import { IUnitsStorePort } from '../domain/ports/stores/units-store.port';
import { UNITS_API_PORT } from '../infra/tokens/units.token';
import { IResponseModel } from '../domain/models/response.model';
import { getApiErrorMessage } from '../infra/interceptors/api-error-message.helper';

@Injectable({ providedIn: 'root' })
export class UnitsStore implements IUnitsStorePort {
  private readonly api = inject(UNITS_API_PORT);
  private readonly _unitsList = signal<IUnitEntity[]>([]);
  private readonly _successMessage = signal<string>('');
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly unitsList = this._unitsList.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  async getAllUnits(): Promise<IResponseModel<IUnitEntity[]>> {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMessage.set('');

    try {
      const response = await this.api.getAllUnits();
      this._unitsList.set(response.data);
      this._successMessage.set(response.message);
      return response;
    } catch (err: unknown) {
      this._error.set(getApiErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }
}
