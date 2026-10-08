import {
  Controller,
  Inject,
  Post,
  Patch,
  Param,
  Body,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { IScoreHistoryController } from './interfaces/score-history.controller.interface';
import { IScoreHistoryService } from './interfaces/score-history.service.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { ScoreHistoryDto } from './dtos/score-history.dto';
import { ScoreHistoryEntity } from './entity/score-history.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { RequiresPermission } from '../../common/decorators/permission.decorator';
import { EPermission } from '../../common/enum/role/permissions.enum';
import { UnitEntity } from '../units/entities/unit.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IJwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Score History - Ajuste de Pontuação')
@Controller('score-history')
export class ScoreHistoryController implements IScoreHistoryController {
  constructor(
    @Inject('IScoreHistoryService')
    private readonly service: IScoreHistoryService,
  ) {}

  @Post(':unitId')
  @RequiresPermission(EPermission.SCORE_HISTORY_ADJUST)
  @ApiOperation({
    summary: 'Ajustar pontuação de uma unidade',
    description:
      'Registra um histórico de ajuste e atualiza o saldo de pontos da unidade. ' +
      '⚠️ **ATENÇÃO:** Para adicionar pontos, envie um valor **positivo** (ex: 50). ' +
      'Para subtrair/remover pontos da unidade, envie um valor **negativo** (ex: -20).',
  })
  @ApiParam({
    name: 'unitId',
    description: 'Identificador único da unidade que receberá o ajuste',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: ScoreHistoryDto,
    description:
      'Dados do ajuste contendo a pontuação (positivo ou negativo) e a descrição',
  })
  @ApiResponse({
    status: 201,
    description: 'Pontuação ajustada com sucesso e histórico registrado.',
    schema: {
      example: {
        success: true,
        data: {
          newScore: 130,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos fornecidos.' })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada.' })
  async requestAdjustUnitScore(
    @Param('unitId') unitId: string,
    @CurrentUser() user: IJwtPayload,
    @TenantId() tenantId: string,
    @Body() dto: ScoreHistoryDto,
  ): Promise<IResponse<null>> {
    return await this.service.requestAdjustUnitScore(
      unitId,
      user.sub,
      tenantId,
      dto,
    );
  }

  @Get(':unitId')
  @RequiresPermission(EPermission.SCORE_HISTORY_READ)
  @ApiOperation({
    summary: 'Buscar histórico de pontuação por unidade',
    description:
      'Retorna o registro do histórico de pontuação associado a uma unidade específica dentro do tenant.',
  })
  @ApiParam({
    name: 'unitId',
    description: 'Identificador único da unidade',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limite de registros a serem retornados',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de pontuação encontrado com sucesso.',
    type: ScoreHistoryEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Histórico não encontrado para a unidade informada.',
  })
  async findHistoryByUnitId(
    @Param('unitId') unitId: string,
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
  ): Promise<IResponse<ScoreHistoryEntity[]>> {
    return await this.service.findHistoryByUnitId(unitId, tenantId, limit);
  }

  @Get('units-options')
  @RequiresPermission(EPermission.SCORE_HISTORY_ADJUST)
  @ApiOperation({
    summary: 'Listar ID e nome de todas as unidades para seleção',
    description:
      'Retorna uma lista simplificada contendo apenas o ID e o nome das unidades do tenant atual, utilizada para popular seletores (dropdowns) em contextos onde a permissão unit.read completa não está disponível.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades obtida com sucesso.',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Unidade Alpha',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  @ApiResponse({ status: 404, description: 'Nenhuma unidade encontrada.' })
  async findAllUnitsNameAndId(
    @TenantId() tenantId: string,
  ): Promise<IResponse<Pick<UnitEntity, 'id' | 'name'>[]>> {
    return this.service.findAllUnitsNameAndId(tenantId);
  }

  @Get('pending/:unitId')
  @RequiresPermission(EPermission.SCORE_HISTORY_APPROVE)
  @ApiOperation({
    summary: 'Listar histórico de pontuações pendentes de uma unidade',
    description:
      'Retorna todos os pedidos de ajuste de pontuação pendentes para aprovação.',
  })
  @ApiParam({ name: 'unitId', description: 'Identificador único da unidade' })
  async retrivePendingUnitsScore(
    @Param('unitId') unitId: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<ScoreHistoryEntity[]>> {
    return await this.service.retrivePendingUnitsScore(unitId, tenantId);
  }

  @Patch('approve/:id')
  @RequiresPermission(EPermission.SCORE_HISTORY_APPROVE)
  @ApiOperation({
    summary: 'Aprovar um pedido de ajuste de pontuação',
    description:
      'Efetiva a pontuação na unidade correspondente e altera o status para aprovado.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único do histórico de pontuação',
  })
  async approveUnitScore(
    @Param('id') scoreHistoryId: string,
    @CurrentUser() user: IJwtPayload,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.service.approveUnitScore(
      scoreHistoryId,
      user.sub,
      tenantId,
    );
  }

  @Patch('reject/:id')
  @RequiresPermission(EPermission.SCORE_HISTORY_APPROVE)
  @ApiOperation({
    summary: 'Rejeitar um pedido de ajuste de pontuação',
    description:
      'Altera o status do histórico para rejeitado sem alterar a pontuação da unidade.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único do histórico de pontuação',
  })
  async rejectUnitScore(
    @Param('id') scoreHistoryId: string,
    @CurrentUser() user: IJwtPayload,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.service.rejectUnitScore(
      scoreHistoryId,
      user.sub,
      tenantId,
    );
  }
}
