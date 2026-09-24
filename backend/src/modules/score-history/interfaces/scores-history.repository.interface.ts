import { ScoreHistoryDto } from '../dtos/adjust-score.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';

export interface IScoreHistoryRepository {
  adjustUnitScore(
    dto: ScoreHistoryDto & { unitId: string; tenantId: string },
  ): Promise<void>;

  findHistoryByUnitId(
    unitId: string,
    tenantId: string,
  ): Promise<ScoreHistoryEntity>;
}
