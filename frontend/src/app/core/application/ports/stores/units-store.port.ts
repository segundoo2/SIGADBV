import { IUnitEntity } from '../../../domain/entities/unit.entity';

export interface IUnitsStorePort {
  readonly unitsList: () => IUnitEntity[];
  readonly isLoading: () => boolean;
  readonly error: () => string | null;

  fetchAllUnits(): Promise<IUnitEntity[]>;
}
