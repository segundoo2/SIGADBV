import { Controller, Post, Body } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { IUnitsController } from './interfaces/units.controller.interface';
import type { IResponse } from '../../common/interfaces/response.interface';
import { UnitEntity } from './entities/unit.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import type { IUnitsService } from './interfaces/units.service.interface';

@Controller('units')
export class UnitsController implements IUnitsController {
  constructor(private readonly service: IUnitsService) {}

  @Post()
  async createUnit(
    @Body() dto: CreateUnitDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<UnitEntity>> {
    return await this.service.createUnit({ ...dto, tenantId });
  }
}
