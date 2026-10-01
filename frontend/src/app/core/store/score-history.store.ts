import { Injectable, inject, signal } from '@angular/core';
import { IScoreHistoryStorePort } from '../domain/ports/stores/score-history-store.port';
import { IScoreHistoryEntity } from '../domain/entities/score-history.entity';
import { IResponseModel } from '../domain/models/response.model';
import { SCORE_HISTORY_API_PORT } from '../infra/tokens/score-history.token';
import { IScoreHistoryPayload } from '../domain/models/score-history-payload.model';
import { getApiErrorMessage } from '../infra/interceptors/api-error-message.helper';

@Injectable({
  providedIn: 'root',
})
export class ScoreHistoryStore implements IScoreHistoryStorePort {
  private readonly scorePort = inject(SCORE_HISTORY_API_PORT);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  async registerScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<IResponseModel<{ newScore: number }>> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      return await this.scorePort.registerScore(unitId, payload);
    } catch (err: unknown) {
      this._error.set(getApiErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  async fetchHistory(
    unitId: string,
  ): Promise<IResponseModel<IScoreHistoryEntity[]>> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      return await this.scorePort.getHistoryByUnitId(unitId);
    } catch (err: unknown) {
      this._error.set(getApiErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }
}
