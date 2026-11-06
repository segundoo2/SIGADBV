import { EScoreHistoryStatus } from '../../../common/enum/score-story/score-history-status.enum';
import { UnitEntity } from '../../units/entities/unit.entity';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { EntityManager, UpdateResult } from 'typeorm';

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

  findOneScoreHistoryForUpdate(
    id: string,
    tenantId: string,
    manager: EntityManager,
  ): Promise<ScoreHistoryEntity | null>;

  approveScoreHistory(
    id: string,
    tenantId: string,
    approvedById: string,
    manager: EntityManager,
  ): Promise<UpdateResult>;

  rejectScoreHistory(
    id: string,
    tenantId: string,
    rejectedById: string,
    manager: EntityManager,
  ): Promise<UpdateResult>;
}
