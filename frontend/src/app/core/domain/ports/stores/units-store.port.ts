import { Signal } from '@angular/core';
import { IUnitEntity } from '../../entities/unit.entity';
import { IResponseModel } from '../../models/response.model';

export interface IUnitsStorePort {
  readonly unitsList: Signal<IUnitEntity[]>;
  readonly successMessage: Signal<string>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<string | null>;

  getAllUnits(): Promise<IResponseModel<IUnitEntity[]>>;
}
