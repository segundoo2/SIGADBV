import { Injectable, inject, signal } from '@angular/core';
import { IUnitEntity } from '../domain/entities/unit.entity';
import { IUnitsStorePort } from '../application/ports/stores/units-store.port';
import { UNITS_API_PORT } from '../infra/tokens/units.token';
import { getErrorMessage } from '../application/errors/get-error-message';

@Injectable({ providedIn: 'root' })
export class UnitCatalogStore implements IUnitsStorePort {
  private readonly unitsApi = inject(UNITS_API_PORT);
  private readonly _unitsList = signal<IUnitEntity[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly unitsList = this._unitsList.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  async fetchAllUnits(): Promise<IUnitEntity[]> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const units = await this.unitsApi.fetchAllUnits();
      this._unitsList.set(units);
      return units;
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }
}
