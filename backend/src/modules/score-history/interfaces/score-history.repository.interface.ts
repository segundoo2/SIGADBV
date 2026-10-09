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

  findAllUnitsNameAndId(
    tenantId: string,
  ): Promise<Pick<UnitEntity, 'id' | 'name'>[]>;

  retrivePendingUnitsScore(tenantId: string): Promise<ScoreHistoryEntity[]>;

  findOneScoreHistoryPending(
    id: string,
    tenantId: string,
  ): Promise<ScoreHistoryEntity | null>;

  approveScoreHistory(
    id: string,
    tenantId: string,
    approvedById: string,
  ): Promise<void>;

  rejectScoreHistory(
    id: string,
    tenantId: string,
    rejectedById: string,
  ): Promise<void>;
}
