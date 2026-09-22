import { IResponse } from '../../../common/interfaces/response.interface';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UpdateUnitDto } from '../dto/update-unit.dto';
import { UnitEntity } from '../entities/unit.entity';

export interface IUnitsService {
  createUnit(
    dto: CreateUnitDto & { tenantId: string },
  ): Promise<IResponse<UnitEntity>>;

  findOneByUnitName(
    unitName: string,
    tenantId: string,
  ): Promise<IResponse<UnitEntity>>;

  findAllUnits(tenantId: string): Promise<IResponse<UnitEntity[]>>;

  updateUnit(
    id: string,
    dto: UpdateUnitDto & { tenantId: string },
  ): Promise<IResponse<null>>;

  adjustUnitScore(
    id: string,
    tenantId: string,
    scoreDelta: number,
  ): Promise<IResponse<{ newScore: number }>>;

  deleteUnit(id: string, tenantId: string): Promise<IResponse<null>>;
}
