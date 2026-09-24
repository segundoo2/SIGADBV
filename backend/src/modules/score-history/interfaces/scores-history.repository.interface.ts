import { ScoreHistoryDto } from '../dtos/adjust-score.dto';

export interface IScoreHistoryRepository {
  adjustUnitScore(
    dto: ScoreHistoryDto & { unitId: string; tenantId: string },
  ): Promise<void>;
}
