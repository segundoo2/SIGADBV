import { IScoreHistoryEntity } from '../../../domain/entities/score-history.entity';
import { IUnitEntity } from '../../../domain/entities/unit.entity';
import { IScoreHistoryPayload } from '../../models/score-history-payload.model';

export interface IScoreHistoryApiPort {
  registerUnitScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<void>;
  fetchUnitScoreHistory(
    unitId: string,
    limit?: number,
  ): Promise<IScoreHistoryEntity[]>;
  fetchAllUnitsOptions(): Promise<Pick<IUnitEntity, 'id' | 'name'>[]>;
  fetchPendingScoreHistories(): Promise<IScoreHistoryEntity[]>;
  approveScoreHistory(id: string): Promise<void>;
  rejectScoreHistory(id: string): Promise<void>;
}
