import { Controller, Inject, Post, Param, Body, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { IScoreHistoryController } from './interfaces/score-history.controller.interface';
import { IScoreHistoryService } from './interfaces/score-history.service.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { ScoreHistoryDto } from './dtos/score-history.dto';
import { ScoreHistoryEntity } from './entity/score-history.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { RequiresPermission } from '../../common/decorators/permission.decorator';
import { EPermission } from '../../common/enum/role/permissions.enum';

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
  async adjustUnitScore(
    @Param('unitId') unitId: string,
    @TenantId() tenantId: string,
    @Body() dto: ScoreHistoryDto,
  ): Promise<IResponse<{ newScore: number }>> {
    return await this.service.adjustUnitScore(unitId, tenantId, dto);
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
  ): Promise<IResponse<ScoreHistoryEntity[]>> {
    return await this.service.findHistoryByUnitId(unitId, tenantId);
  }
}
