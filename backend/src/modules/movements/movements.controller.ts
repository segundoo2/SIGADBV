import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import type { IMovementsService } from './interfaces/movements.service.interface';
import { IMovementsController } from './interfaces/movements.controller.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { MovementDto } from './dtos/movement.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AllocateLocationDto } from './dtos/allocate-product-location.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { RequiresPermission } from '../../common/decorators/permission.decorator';
import { EErrorsGlobal } from '../../common/enum/errors-global.enum';
import { EPermission } from '../../common/enum/permissions.enum';
import { Movement } from './entities/movement.entity';

@ApiTags('Movements')
@ApiBearerAuth()
@Controller('movements')
export class MovementsController implements IMovementsController {
  constructor(
    @Inject('IMovementsService')
    private readonly service: IMovementsService,
  ) {}

  @Get('product/:productId')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.MOVIMENT_READ)
  @ApiOperation({
    summary: 'Listar movimentações por produto',
    description:
      'Retorna o histórico paginado de movimentações de um produto específico.',
  })
  @ApiParam({ name: 'productId', description: 'ID do produto' })
  @ApiOkResponse({ description: 'Movimentações encontradas com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados de requisição inválidos.' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'Token de acesso ausente ou inválido.',
  })
  @ApiForbiddenResponse({
    description: 'Sem permissão para listar movimentações.',
  })
  async findAllPaginatedByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @TenantId() tenantId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Movement[]>> {
    if (!tenantId) {
      throw new BadRequestException(EErrorsGlobal.INVALID_DATA);
    }
    return await this.service.findAllPaginatedByProduct(
      productId,
      tenantId,
      query,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequiresPermission(EPermission.MOVEMENT_REGISTER)
  @ApiOperation({
    summary: 'Registra movimentação de entrada/saída geral',
    description:
      'Registra uma entrada ou saída no saldo do produto e atualiza o histórico.',
  })
  @ApiCreatedResponse({ description: 'Movimentação registrada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou divergência de saldo.',
  })
  @ApiNotFoundResponse({ description: 'Produto não encontrado.' })
  @ApiUnauthorizedResponse({
    description: 'Token de acesso ausente ou inválido.',
  })
  @ApiForbiddenResponse({
    description: 'Sem permissão para registrar movimentações.',
  })
  async registerMovement(
    @Body() movements: MovementDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    if (!tenantId) {
      throw new BadRequestException(EErrorsGlobal.INVALID_DATA);
    }
    return await this.service.registerMovement({ ...movements, tenantId });
  }

  @Post('allocate-location')
  @HttpCode(HttpStatus.CREATED)
  @RequiresPermission(EPermission.MOVEMENT_ALLOCATE)
  @ApiOperation({
    summary: 'Aloca ou transfere produtos entre posições físicas',
    description:
      'Aloca produtos do saldo geral para uma posição física ou realiza transferência entre posições.',
  })
  @ApiCreatedResponse({ description: 'Alocação efetuada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou saldo insuficiente.',
  })
  @ApiNotFoundResponse({
    description: 'Produto ou localização não encontrada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de acesso ausente ou inválido.',
  })
  @ApiForbiddenResponse({
    description: 'Sem permissão para alocar movimentações.',
  })
  async allocateLocation(
    @Body() dto: AllocateLocationDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    if (!tenantId) {
      throw new BadRequestException(EErrorsGlobal.INVALID_DATA);
    }
    return await this.service.allocateLocation({ ...dto, tenantId });
  }
}
