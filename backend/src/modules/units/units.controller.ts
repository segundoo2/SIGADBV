import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { IUnitsController } from './interfaces/units.controller.interface';
import type { IResponse } from '../../common/interfaces/response.interface';
import { UnitEntity } from './entities/unit.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('units')
export class UnitsController implements IUnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  async createUnit(
    @Body() dto: CreateUnitDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<UnitEntity>> {
    
  }
}
