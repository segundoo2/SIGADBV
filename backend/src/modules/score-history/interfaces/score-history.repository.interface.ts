import { IJwtPayloadWithExpiry } from '../../auth/interfaces/jwt-payload.interface';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';

export interface IScoreHistoryRepository {
  adjustUnitScore(
    dto: ScoreHistoryDto & {
      unitId: string;
      currentUser: string;
      tenantId: string;
    },
  ): Promise<void>;

  findAllHistoryScorePending(tenantId: string): Promise<ScoreHistoryEntity[]>;

  approveScore(
    scoreHistoryId: string,
    tenantId: string,
    currentUser: IJwtPayloadWithExpiry,
  ): Promise<void>;

  findHistoryByUnitId(
    unitId: string,
    tenantId: string,
    limit?: number,
  ): Promise<ScoreHistoryEntity[]>;
}
