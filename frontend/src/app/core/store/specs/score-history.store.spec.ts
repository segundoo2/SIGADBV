import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnitScoreHistoryStore } from '../score-history.store';
import { SCORE_HISTORY_API_PORT } from '../../infra/tokens/score-history.token';
import { IScoreHistoryPayload } from '../../application/models/score-history-payload.model';
import { IScoreHistoryEntity } from '../../domain/entities/score-history.entity';
import { ApiError } from '../../infra/interceptors/api-error.interceptor';

describe('UnitScoreHistoryStore', () => {
  let store: UnitScoreHistoryStore;
  let apiPortMock: {
    registerUnitScore: ReturnType<typeof vi.fn>;
    fetchUnitScoreHistory: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiPortMock = {
      registerUnitScore: vi.fn(),
      fetchUnitScoreHistory: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UnitScoreHistoryStore,
        { provide: SCORE_HISTORY_API_PORT, useValue: apiPortMock },
      ],
    });

    store = TestBed.inject(UnitScoreHistoryStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('registerUnitScore', () => {
    const unitId = '123e4567-e89b-12d3-a456-426614174000';
    const payload: IScoreHistoryPayload = {
      score: 30,
      description: 'Participação em evento',
    };

    it('should successfully register score, manage loading state, and return response', async () => {
      apiPortMock.registerUnitScore.mockResolvedValueOnce(undefined);

      const promise = store.registerUnitScore(unitId, payload);

      expect(store.isLoading()).toBe(true);
      expect(store.error()).toBeNull();

      const result = await promise;

      expect(result).toBeUndefined();
      expect(apiPortMock.registerUnitScore).toHaveBeenCalledWith(
        unitId,
        payload,
      );
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should handle error, set error signal, stop loading, and rethrow error when registration fails', async () => {
      const mockError = new ApiError('Unit score limit exceeded', 400);
      apiPortMock.registerUnitScore.mockRejectedValueOnce(mockError);

      await expect(store.registerUnitScore(unitId, payload)).rejects.toThrow(
        mockError,
      );

      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBe('Unit score limit exceeded');
    });
  });

  describe('fetchUnitScoreHistory', () => {
    const unitId = '123e4567-e89b-12d3-a456-426614174000';
    const history: IScoreHistoryEntity[] = [];

    it('should successfully fetch history with limit, manage loading state, and return response', async () => {
      apiPortMock.fetchUnitScoreHistory.mockResolvedValueOnce(history);

      const promise = store.fetchUnitScoreHistory(unitId, 10);

      expect(store.isLoading()).toBe(true);
      const result = await promise;

      expect(result).toEqual(history);
      expect(apiPortMock.fetchUnitScoreHistory).toHaveBeenCalledWith(
        unitId,
        10,
      );
      expect(store.isLoading()).toBe(false);
    });

    it('should successfully fetch history without limit, manage loading state, and return response', async () => {
      apiPortMock.fetchUnitScoreHistory.mockResolvedValueOnce(history);

      const promise = store.fetchUnitScoreHistory(unitId);

      expect(store.isLoading()).toBe(true);
      expect(store.error()).toBeNull();

      const result = await promise;

      expect(result).toEqual(history);
      expect(apiPortMock.fetchUnitScoreHistory).toHaveBeenCalledWith(unitId);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should handle error, set error signal, stop loading, and rethrow error when fetch fails', async () => {
      const mockError = new ApiError('Unit not found', 404);
      apiPortMock.fetchUnitScoreHistory.mockRejectedValueOnce(mockError);

      await expect(store.fetchUnitScoreHistory(unitId)).rejects.toThrow(
        mockError,
      );

      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBe('Unit not found');
    });
  });
});
