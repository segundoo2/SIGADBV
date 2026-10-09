import { IScoreHistoryEntity } from '../../../domain/entities/score-history.entity';
import { IUnitEntity } from '../../../domain/entities/unit.entity';
import { IScoreHistoryPayload } from '../../models/score-history-payload.model';

export interface IScoreHistoryStorePort {
  readonly isLoading: () => boolean;
  readonly error: () => string | null;
  readonly unitsOptions: () => Pick<IUnitEntity, 'id' | 'name'>[];
  readonly pendingHistories: () => IScoreHistoryEntity[];

  registerUnitScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<void>;
  fetchUnitScoreHistory(
    unitId: string,
    limit?: number,
  ): Promise<IScoreHistoryEntity[]>;
  fetchAllUnitsOptions(): Promise<void>;
  fetchPendingScoreHistories(): Promise<void>;
  approveScoreHistory(id: string): Promise<void>;
  rejectScoreHistory(id: string): Promise<void>;
  clearError(): void;
}
