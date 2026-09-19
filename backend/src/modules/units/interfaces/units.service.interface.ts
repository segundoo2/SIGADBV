import { IResponse } from '../../../common/interfaces/response.interface';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UnitEntity } from '../entities/unit.entity';

export interface IUnitsService {
  createUnit(
    dto: CreateUnitDto & { tenantId: string },
  ): Promise<IResponse<UnitEntity>>;
}
