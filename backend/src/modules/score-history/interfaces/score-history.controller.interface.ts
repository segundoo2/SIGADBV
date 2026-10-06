import { IResponse } from '../../../common/interfaces/response.interface';
import { IJwtPayloadWithExpiry } from '../../auth/interfaces/jwt-payload.interface';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';

export interface IScoreHistoryController {
  adjustUnitScore(
    unitId: string,
    currentUser: IJwtPayloadWithExpiry,
    tenantId: string,
    dto: ScoreHistoryDto,
  ): Promise<IResponse<{ newScore: number }>>;

  findAllHistoryScorePending(
    tenantId: string,
  ): Promise<IResponse<ScoreHistoryEntity[]>>;

  approveScore(
    scoreHistoryId: string,
    tenantId: string,
    currentUser: IJwtPayloadWithExpiry,
  ): Promise<IResponse<null>>;

  findHistoryByUnitId(
    unitId: string,
    tenantId: string,
    limit?: number,
  ): Promise<IResponse<ScoreHistoryEntity[]>>;
}
