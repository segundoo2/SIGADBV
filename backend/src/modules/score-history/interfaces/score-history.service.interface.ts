import { IResponse } from '../../../common/interfaces/response.interface';
import { UnitEntity } from '../../units/entities/unit.entity';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';

export interface IScoreHistoryService {
  requestAdjustUnitScore(
    unitId: string,
    userId: string,
    tenantId: string,
    dto: ScoreHistoryDto,
  ): Promise<IResponse<null>>;

  findHistoryByUnitId(
    unitId: string,
    tenantId: string,
    limit?: number,
  ): Promise<IResponse<ScoreHistoryEntity[]>>;

  findAllUnitsNameAndId(
    tenantId: string,
  ): Promise<IResponse<Pick<UnitEntity, 'id' | 'name'>[]>>;

  retrivePendingUnitsScore(
    tenantId: string,
  ): Promise<IResponse<ScoreHistoryEntity[]>>;

  approveUnitScore(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<IResponse<null>>;

  rejectUnitScore(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<IResponse<null>>;
}
