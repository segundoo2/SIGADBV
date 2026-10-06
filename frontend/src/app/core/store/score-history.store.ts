import { Injectable, inject, signal } from '@angular/core';
import { IScoreHistoryStorePort } from '../application/ports/stores/score-history-store.port';
import { IScoreHistoryEntity } from '../domain/entities/score-history.entity';
import { SCORE_HISTORY_API_PORT } from '../infra/tokens/score-history.token';
import { IScoreHistoryPayload } from '../application/models/score-history-payload.model';
import { getErrorMessage } from '../application/errors/get-error-message';

@Injectable({
  providedIn: 'root',
})
export class UnitScoreHistoryStore implements IScoreHistoryStorePort {
  private readonly scoreHistoryApi = inject(SCORE_HISTORY_API_PORT);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  async registerUnitScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.scoreHistoryApi.registerUnitScore(unitId, payload);
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  async fetchUnitScoreHistory(
    unitId: string,
    limit?: number,
  ): Promise<IScoreHistoryEntity[]> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      if (limit === undefined) {
        return await this.scoreHistoryApi.fetchUnitScoreHistory(unitId);
      }

      return await this.scoreHistoryApi.fetchUnitScoreHistory(unitId, limit);
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  async fetchPendingScoreHistories(): Promise<IScoreHistoryEntity[]> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      return await this.scoreHistoryApi.fetchPendingScoreHistories();
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  async approveScore(scoreHistoryId: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.scoreHistoryApi.approveScore(scoreHistoryId);
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }
}