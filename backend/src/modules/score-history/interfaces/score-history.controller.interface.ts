import { IResponse } from '../../../common/interfaces/response.interface';
import { ScoreHistoryDto } from '../dtos/adjust-score.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';

export interface IScoreHistoryController {
  adjustUnitScore(
    unitId: string,
    tenantId: string,
    dto: ScoreHistoryDto,
  ): Promise<IResponse<{ newScore: number }>>;

  findHistoryByUnitId(
    unitId: string,
    tenantId: string,
  ): Promise<IResponse<ScoreHistoryEntity>>;
}
