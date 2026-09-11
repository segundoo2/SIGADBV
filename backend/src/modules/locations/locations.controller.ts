import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { ILocationsController } from './interfaces/locations.controller.interface';
import type { ILocationsService } from './interfaces/locations.service.interface';
import { LocationDto } from './dtos/location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { Location } from './entities/location.entity';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { IResponse } from '../../common/interfaces/response.interface';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { EPermission } from '../../common/enum/permissions.enum';
import { EErrorsGlobal } from '../../common/enum/errors-global.enum';
import { RequiresPermission } from '../../common/decorators/permission.decorator';

@ApiTags('locations')
@ApiBearerAuth()
@Controller('locations')
export class LocationsController implements ILocationsController {
  constructor(
    @Inject('ILocationsService')
    private readonly locationsService: ILocationsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequiresPermission(EPermission.LOCATION_CREATE)
  @ApiOperation({
    summary: 'Criar localização',
    description: 'Cria uma nova localização para o tenant logado.',
  })
  @ApiCreatedResponse({ description: 'Localização criada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados informados inválidos.' })
  @ApiUnauthorizedResponse({
    description: 'Token de acesso inválido ou expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado: permissão insuficiente.',
  })
  async createLocation(
    @TenantId() tenantId: string,
    @Body() locationDto: LocationDto,
  ): Promise<IResponse<null>> {
    if (!tenantId) {
      throw new BadRequestException(EErrorsGlobal.INVALID_DATA);
    }

    return await this.locationsService.createLocation({
      ...locationDto,
      tenantId,
    });
  }

  @Get(':code')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.LOCATION_READ)
  @ApiOperation({
    summary: 'Buscar localização por código',
    description: 'Busca uma localização pelo código informado.',
  })
  @ApiParam({ name: 'code', description: 'Código da localização' })
  @ApiOkResponse({ description: 'Localização encontrada.' })
  @ApiNotFoundResponse({ description: 'Localização não encontrada.' })
  @ApiUnauthorizedResponse({
    description: 'Token de acesso inválido ou expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado: permissão insuficiente.',
  })
  async findByCode(
    @Param('code') code: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<Location>> {
    if (!code || !tenantId) {
      throw new BadRequestException(EErrorsGlobal.INVALID_DATA);
    }

    return await this.locationsService.findByCode(code, tenantId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.LOCATION_READ)
  @ApiOperation({
    summary: 'Listar todas as localizações',
    description: 'Retorna uma lista paginada de localizações.',
  })
  @ApiOkResponse({ description: 'Lista de localizações retornada.' })
  @ApiNotFoundResponse({ description: 'Nenhuma localização encontrada.' })
  @ApiUnauthorizedResponse({
    description: 'Token de acesso inválido ou expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado: permissão insuficiente.',
  })
  async findAllLocations(
    @TenantId() tenantId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Location[]>> {
    if (!tenantId) {
      throw new BadRequestException(EErrorsGlobal.INVALID_DATA);
    }

    return await this.locationsService.findAllLocations(tenantId, query);
  }

  @Patch(':code')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.LOCATION_UPDATE)
  @ApiOperation({
    summary: 'Atualizar localização',
    description:
      'Atualiza parcialmente os campos de uma localização existente.',
  })
  @ApiParam({ name: 'code', description: 'Código atual da localização' })
  @ApiOkResponse({ description: 'Localização atualizada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados informados inválidos.' })
  @ApiNotFoundResponse({ description: 'Localização não encontrada.' })
  @ApiUnauthorizedResponse({
    description: 'Token de acesso inválido ou expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado: permissão insuficiente.',
  })
  async updateLocation(
    @Param('code') code: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    if (!code || !tenantId) {
      throw new BadRequestException(EErrorsGlobal.INVALID_DATA);
    }

    return await this.locationsService.updateLocation(
      code,
      updateLocationDto,
      tenantId,
    );
  }

  @Delete(':code')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.LOCATION_DELETE)
  @ApiOperation({
    summary: 'Deletar localização',
    description: 'Remove uma localização pelo código fornecido.',
  })
  @ApiParam({ name: 'code', description: 'Código da localização' })
  @ApiOkResponse({ description: 'Localização deletada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Localização não encontrada.' })
  @ApiUnauthorizedResponse({
    description: 'Token de acesso inválido ou expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acesso negado: permissão insuficiente.',
  })
  async deleteLocation(
    @Param('code') code: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    if (!code || !tenantId) {
      throw new BadRequestException(EErrorsGlobal.INVALID_DATA);
    }

    return await this.locationsService.deleteLocation(code, tenantId);
  }
}
