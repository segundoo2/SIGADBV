import {
  Controller,
  Inject,
  Post,
  Param,
  Body,
  Get,
  Query,
  Patch,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IJwtPayloadWithExpiry } from '../auth/interfaces/jwt-payload.interface';

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
    summary: 'Ajustar pontuação de uma unidade (Pendente)',
    description:
      'Registra um histórico de ajuste pendente de aprovação. ' +
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
    description: 'Dados do ajuste contendo a pontuação e a descrição',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitação de ajuste registrada com sucesso.',
  })
  async adjustUnitScore(
    @Param('unitId') unitId: string,
    @CurrentUser() CurrentUser: IJwtPayloadWithExpiry,
    @TenantId() tenantId: string,
    @Body() dto: ScoreHistoryDto,
  ): Promise<IResponse<{ newScore: number }>> {
    return await this.service.adjustUnitScore(
      unitId,
      CurrentUser.sub,
      tenantId,
      dto,
    );
  }

  @Get('pending')
  @RequiresPermission(EPermission.SCORE_HISTORY_READ)
  @ApiOperation({
    summary: 'Listar histórico de pontuações pendentes',
    description:
      'Retorna todos os registos de ajustes de pontuação pendentes de aprovação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pontuações pendentes encontrada com sucesso.',
    type: [ScoreHistoryEntity],
  })
  async findAllHistoryScorePending(
    @TenantId() tenantId: string,
  ): Promise<IResponse<ScoreHistoryEntity[]>> {
    return await this.service.findAllHistoryScorePending(tenantId);
  }

  @Patch(':id/approve')
  @RequiresPermission(EPermission.SCORE_HISTORY_ADJUST)
  @ApiOperation({
    summary: 'Aprovar um ajuste de pontuação',
    description:
      'Aprova o lançamento pendente, efetuando a pontuação na unidade.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único do histórico de pontuação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Pontuação aprovada com sucesso.' })
  async approveScore(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() CurrentUser: IJwtPayloadWithExpiry,
  ): Promise<IResponse<null>> {
    return await this.service.approveScore(id, tenantId, CurrentUser);
  }

  @Get(':unitId')
  @RequiresPermission(EPermission.SCORE_HISTORY_READ)
  @ApiOperation({
    summary: 'Buscar histórico de pontuação por unidade',
  })
  @ApiParam({
    name: 'unitId',
    description: 'Identificador único da unidade',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
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
    type: [ScoreHistoryEntity],
  })
  async findHistoryByUnitId(
    @Query('unitId') unitId: string,
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
  ): Promise<IResponse<ScoreHistoryEntity[]>> {
    return await this.service.findHistoryByUnitId(unitId, tenantId, limit);
  }
}
