import { CreateUnitDto } from '../dto/create-unit.dto';
import { UnitEntity } from '../entities/unit.entity';

export interface IUnitsRepository {
  createUnit(dto: CreateUnitDto & { tenantId: string }): Promise<UnitEntity>;
  findOneByUnitName(
    unitName: string,
    tenantId: string,
  ): Promise<UnitEntity | null>;
}
