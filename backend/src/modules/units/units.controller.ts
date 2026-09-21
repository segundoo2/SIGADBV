import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { IUnitsController } from './interfaces/units.controller.interface';
import type { IResponse } from '../../common/interfaces/response.interface';
import { UnitEntity } from './entities/unit.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import type { IUnitsService } from './interfaces/units.service.interface';
import { UpdateUnitDto } from './dto/update-unit.dto';

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

  @Get(':unitName')
  async findOneByUnitName(
    @Param('unitName') unitName: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<UnitEntity>> {
    return await this.service.findOneByUnitName(unitName, tenantId);
  }

  @Get()
  async findAllUnits(
    @TenantId() tenantId: string,
  ): Promise<IResponse<UnitEntity[]>> {
    return await this.service.findAllUnits(tenantId);
  }

  @Put(':id')
  async updateUnit(
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.service.updateUnit(id, { ...dto, tenantId });
  }

  @Delete()
  async deleteUnit(id: string, tenantId: string): Promise<IResponse<null>> {
    return await this.service.deleteUnit(id, tenantId);
  }
}
