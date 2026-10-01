import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiHeader } from '@nestjs/swagger';
import { IMetricsController } from './interfaces/metrics.controller.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { IMetricsService } from './interfaces/metrics.service.interface';
import { IChartDataUnitsScore } from './interfaces/chart-data-units-score.interface';
import { RequiresPermission } from '../../common/decorators/permission.decorator';
import { EPermission } from '../../common/enum/role/permissions.enum';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController implements IMetricsController {
  constructor(
    @Inject('IMetricsService') private readonly service: IMetricsService,
  ) {}

  @Get()
  @RequiresPermission(EPermission.METRICS)
  @ApiOperation({
    summary: 'Listar pontuação das unidades',
    description:
      'Retorna os dados consolidados de pontuação por unidade para exibição em gráficos.',
  })
  @ApiHeader({
    name: 'x-tenant-slug',
    description: 'Slug do tenant para identificação do contexto',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pontuações recuperada com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado (Token ausente ou inválido).',
  })
  async findListScoreUnits(
    tenantId: string,
  ): Promise<IResponse<IChartDataUnitsScore[]>> {
    return await this.service.findListScoreUnits(tenantId);
  }
}
