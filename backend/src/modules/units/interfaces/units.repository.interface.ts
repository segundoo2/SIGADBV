import { CreateUnitDto } from '../dto/create-unit.dto';
import { UnitEntity } from '../entities/unit.entity';

export interface IUnitsRepository {
  createUnit(dto: CreateUnitDto & { tenantId: string }): Promise<UnitEntity>;
}
