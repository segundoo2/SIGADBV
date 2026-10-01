import { Signal } from '@angular/core';
import { IScoreHistoryEntity } from '../../entities/score-history.entity';
import { IResponseModel } from '../../models/response.model';
import { IScoreHistoryPayload } from '../../models/score-history-payload.model';

export interface IScoreHistoryStorePort {
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<string | null>;

  registerScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<IResponseModel<{ newScore: number }>>;

  fetchHistory(unitId: string): Promise<IResponseModel<IScoreHistoryEntity[]>>;
}
