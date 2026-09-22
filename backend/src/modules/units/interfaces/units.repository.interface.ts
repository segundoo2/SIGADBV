import { DeleteResult, UpdateResult } from 'typeorm';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UpdateUnitDto } from '../dto/update-unit.dto';
import { UnitEntity } from '../entities/unit.entity';

export interface IUnitsRepository {
  createUnit(dto: CreateUnitDto & { tenantId: string }): Promise<UnitEntity>;

  findOneByUnitName(
    unitName: string,
    tenantId: string,
  ): Promise<UnitEntity | null>;

  findOneById(id: string, tenantId: string): Promise<UnitEntity>;

  findAllUnits(tenantId: string): Promise<UnitEntity[] | []>;

  updateUnit(
    id: string,
    dto: UpdateUnitDto & { tenantId: string },
  ): Promise<UpdateResult>;

  adjustUnitScore(
    id: string,
    tenantId: string,
    newScore: number,
  ): Promise<void>;

  deleteUnit(id: string, tenantId: string): Promise<DeleteResult>;
}
