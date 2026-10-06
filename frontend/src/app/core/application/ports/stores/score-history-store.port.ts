import { IScoreHistoryEntity } from '../../domain/entities/score-history.entity';
import { IScoreHistoryPayload } from '../../application/models/score-history-payload.model';

export interface IScoreHistoryStorePort {
  registerUnitScore(unitId: string, payload: IScoreHistoryPayload): Promise<void>;
  fetchUnitScoreHistory(unitId: string, limit?: number): Promise<IScoreHistoryEntity[]>;
  fetchPendingScoreHistories(): Promise<IScoreHistoryEntity[]>;
  approveScore(scoreHistoryId: string): Promise<void>;
}

export const SCORE_HISTORY_STORE_PORT = Symbol('SCORE_HISTORY_STORE_PORT');