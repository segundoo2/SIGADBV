import { Injectable } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { IUnitsService } from './interfaces/units.service.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { UnitEntity } from './entities/unit.entity';

@Injectable()
export class UnitsService implements IUnitsService {
  async createUnit(dto: CreateUnitDto & { tenantId: string; }): Promise<IResponse<UnitEntity>> {
    
  }
}
