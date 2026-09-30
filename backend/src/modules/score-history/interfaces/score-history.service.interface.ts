import { IResponse } from '../../../common/interfaces/response.interface';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';

export interface IScoreHistoryService {
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
