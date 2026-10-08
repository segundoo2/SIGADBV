import { IScoreHistoryEntity } from '../../../domain/entities/score-history.entity';
import { IUnitEntity } from '../../../domain/entities/unit.entity';
import { IScoreHistoryPayload } from '../../models/score-history-payload.model';

export interface IScoreHistoryStorePort {
  isLoading: () => boolean;
  error: () => string | null;

  registerUnitScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<void>;
  fetchUnitScoreHistory(
    unitId: string,
    limit?: number,
  ): Promise<IScoreHistoryEntity[]>;
  findAllUnitsNameAndId(): Promise<Pick<IUnitEntity, 'id' | 'name'>[]>;
  retrivePendingUnitsScore(unitId: string): Promise<IScoreHistoryEntity[]>;
  approveUnitScore(scoreHistoryId: string): Promise<void>;
  rejectUnitScore(scoreHistoryId: string): Promise<void>;
}
