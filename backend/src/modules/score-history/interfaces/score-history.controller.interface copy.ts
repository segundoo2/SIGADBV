import { IResponse } from '../../../common/interfaces/response.interface';
import { ScoreHistoryDto } from '../dtos/adjust-score.dto';

export interface IScoreHistoryController {
  adjustUnitScore(
    unitId: string,
    tenantId: string,
    dto: ScoreHistoryDto,
  ): Promise<IResponse<{ newScore: number }>>;
}
