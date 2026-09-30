import { ScoreHistoryDto } from '../dtos/score-history.dto';
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
