import { Injectable } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UnitEntity } from './entities/unit.entity';

@Injectable()
export class UnitsRepository implements IUnitsRepository {
  async createUnit(dto: CreateUnitDto & { tenantId: string; }): Promise<UnitEntity> {
    
  }
}
