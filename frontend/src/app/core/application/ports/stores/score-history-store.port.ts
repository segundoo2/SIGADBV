import { IScoreHistoryEntity } from '../../../domain/entities/score-history.entity';
import { IScoreHistoryPayload } from '../../models/score-history-payload.model';

export interface IScoreHistoryStorePort {
  readonly isLoading: () => boolean;
  readonly error: () => string | null;

  registerUnitScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<void>;
  fetchUnitScoreHistory(
    unitId: string,
    limit?: number,
  ): Promise<IScoreHistoryEntity[]>;
}
