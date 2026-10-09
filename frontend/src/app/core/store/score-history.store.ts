import { Injectable, inject, signal } from '@angular/core';
import { IScoreHistoryStorePort } from '../application/ports/stores/score-history-store.port';
import { IScoreHistoryEntity } from '../domain/entities/score-history.entity';
import { SCORE_HISTORY_API_PORT } from '../infra/tokens/score-history.token';
import { IScoreHistoryPayload } from '../application/models/score-history-payload.model';
import { getErrorMessage } from '../application/errors/get-error-message';
import { IUnitEntity } from '../domain/entities/unit.entity';

@Injectable({
  providedIn: 'root',
})
export class UnitScoreHistoryStore implements IScoreHistoryStorePort {
  private readonly scoreHistoryApi = inject(SCORE_HISTORY_API_PORT);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _unitsOptions = signal<Pick<IUnitEntity, 'id' | 'name'>[]>(
    [],
  );
  private readonly _pendingHistories = signal<IScoreHistoryEntity[]>([]);

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly unitsOptions = this._unitsOptions.asReadonly();
  readonly pendingHistories = this._pendingHistories.asReadonly();

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

  async fetchAllUnitsOptions(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      this._unitsOptions.set(await this.scoreHistoryApi.fetchAllUnitsOptions());
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  async fetchPendingScoreHistories(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const data = await this.scoreHistoryApi.fetchPendingScoreHistories();
      this._pendingHistories.set(data);
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
      this._pendingHistories.set([]);
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  async approveScoreHistory(id: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.scoreHistoryApi.approveScoreHistory(id);
      this._pendingHistories.update((list) =>
        list.filter((item) => item.id !== id),
      );
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  async rejectScoreHistory(id: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.scoreHistoryApi.rejectScoreHistory(id);
      this._pendingHistories.update((list) =>
        list.filter((item) => item.id !== id),
      );
    } catch (err: unknown) {
      this._error.set(getErrorMessage(err));
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  clearError(): void {
    this._error.set(null);
  }
}
