import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IMetricsService } from './interfaces/metrics.service.interface';
import { IMetricsRepository } from './interfaces/metrics.repository.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { IChartDataUnitsScore } from './interfaces/chart-data-units-score.interface';
import { EMetricsSuccess } from '../../common/enum/metrics/metrics-success.enum';
import { EMetricsErrors } from '../../common/enum/metrics/metrics-errors.enum';

@Injectable()
export class MetricsService implements IMetricsService {
  constructor(
    @Inject('IMetricsRepository')
    private readonly repository: IMetricsRepository,
  ) {}

  async findListScoreUnits(
    tenantId: string,
  ): Promise<IResponse<IChartDataUnitsScore[]>> {
    const units = await this.repository.findListScoreUnits(tenantId);

    if (!units || units.length === 0) {
      throw new NotFoundException(EMetricsErrors.NOT_FOUND_LIST);
    }

    return {
      message: EMetricsSuccess.FIND_LIST_SCORE,
      data: units.map((unit) => ({
        name: unit.name,
        value: unit.score,
      })),
    };
  }
}
