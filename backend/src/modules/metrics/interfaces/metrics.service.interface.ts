import { IResponse } from '../../../common/interfaces/response.interface';
import { IChartDataUnitsScore } from './chart-data-units-score.interface';

export interface IMetricsService {
  findListScoreUnits(
    tenantId: string,
  ): Promise<IResponse<IChartDataUnitsScore[]>>;
}
