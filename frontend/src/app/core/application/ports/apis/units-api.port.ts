import { IUnitEntity } from '../../../domain/entities/unit.entity';

export interface IUnitsApiPort {
  fetchAllUnits(): Promise<IUnitEntity[]>;
}
