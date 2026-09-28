import { Controller, Get, Inject } from '@nestjs/common';
import { IMetricsController } from './interfaces/metrics.controller.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { IMetricsService } from './interfaces/metrics.service.interface';
import { IChartDataUnitsScore } from './interfaces/chart-data-units-score.interface';

@Controller('metrics')
export class MetricsController implements IMetricsController {
  constructor(
    @Inject('IMetricsService') private readonly service: IMetricsService,
  ) {}

  @Get()
  async findListScoreUnits(
    tenantId: string,
  ): Promise<IResponse<IChartDataUnitsScore[]>> {
    return await this.service.findListScoreUnits(tenantId);
  }
}
