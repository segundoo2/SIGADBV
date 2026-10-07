import { EScoreHistoryStatus } from '../../../common/enum/score-story/score-history-status.enum';
import { UnitEntity } from '../../units/entities/unit.entity';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';

export interface IScoreHistoryRepository {
  requestAdjustUnitScore(
    dto: ScoreHistoryDto & {
      unitId: string;
      requestedById: string;
      tenantId: string;
      status: EScoreHistoryStatus;
    },
  ): Promise<void>;

  findHistoryByUnitId(
    unitId: string,
    tenantId: string,
    limit?: number,
  ): Promise<ScoreHistoryEntity[]>;

  findOneScoreHistoryPending(
    scoreHistoryId: string,
    tenantId: string,
  ): Promise<ScoreHistoryEntity | null>;

  findAllUnitsNameAndId(
    tenantId: string,
  ): Promise<Pick<UnitEntity, 'id' | 'name'>[]>;

  retrivePendingUnitsScore(
    unitId: string,
    tenantId: string,
  ): Promise<ScoreHistoryEntity[]>;

  approveScoreHistory(
    scoreHistoryId: string,
    tenantId: string,
    approvedById: string,
  ): Promise<void>;

  rejectScoreHistory(
    scoreHistoryId: string,
    tenantId: string,
    rejectedById: string,
  ): Promise<void>;
}
