import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateUnitDto } from './dto/create-unit.dto';
import { IUnitsController } from './interfaces/units.controller.interface';
import type { IResponse } from '../../common/interfaces/response.interface';
import { UnitEntity } from './entities/unit.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import type { IUnitsService } from './interfaces/units.service.interface';
import { UpdateUnitDto } from './dto/update-unit.dto';

@ApiTags('Units')
@Controller('units')
export class UnitsController implements IUnitsController {
  constructor(
    @Inject('IUnitsService') private readonly service: IUnitsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova unidade' })
  @ApiResponse({
    status: 201,
    description: 'Unidade criada com sucesso.',
    type: UnitEntity,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito: Já existe uma unidade com este nome.',
  })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  async createUnit(
    @Body() dto: CreateUnitDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<UnitEntity>> {
    return await this.service.createUnit({ ...dto, tenantId });
  }

  @Get(':unitName')
  @ApiOperation({ summary: 'Buscar uma unidade pelo nome' })
  @ApiParam({
    name: 'unitName',
    description: 'Nome da unidade a ser buscada',
    example: 'Gavião-Real',
  })
  @ApiResponse({
    status: 200,
    description: 'Unidade encontrada com sucesso.',
    type: UnitEntity,
  })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  async findOneByUnitName(
    @Param('unitName') unitName: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<UnitEntity>> {
    return await this.service.findOneByUnitName(unitName, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as unidades do clube' })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades retornada com sucesso.',
    type: [UnitEntity],
  })
  @ApiResponse({ status: 404, description: 'Nenhuma unidade encontrada.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  async findAllUnits(
    @TenantId() tenantId: string,
  ): Promise<IResponse<UnitEntity[]>> {
    return await this.service.findAllUnits(tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar os dados de uma unidade' })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) da unidade',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Unidade alterada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  async updateUnit(
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.service.updateUnit(id, { ...dto, tenantId });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma unidade' })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) da unidade',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Unidade excluída com sucesso.' })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada.' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor.' })
  async deleteUnit(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.service.deleteUnit(id, tenantId);
  }
}
