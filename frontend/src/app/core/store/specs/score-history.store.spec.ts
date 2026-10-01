import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreHistoryStore } from '../score-history.store';
import { SCORE_HISTORY_API_PORT } from '../../infra/tokens/score-history.token';
import { IScoreHistoryApiPort } from '../../domain/ports/apis/score-history-api.port';
import { IScoreHistoryPayload } from '../../domain/models/score-history-payload.model';
import { IScoreHistoryEntity } from '../../domain/entities/score-history.entity';
import { IResponseModel } from '../../domain/models/response.model';
import { ApiError } from '../../infra/interceptors/api-error.interceptor';

describe('ScoreHistoryStore', () => {
  let store: ScoreHistoryStore;
  let apiPortMock: {
    registerScore: ReturnType<typeof vi.fn>;
    getHistoryByUnitId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiPortMock = {
      registerScore: vi.fn(),
      getHistoryByUnitId: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ScoreHistoryStore,
        { provide: SCORE_HISTORY_API_PORT, useValue: apiPortMock },
      ],
    });

    store = TestBed.inject(ScoreHistoryStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('registerScore', () => {
    const unitId = '123e4567-e89b-12d3-a456-426614174000';
    const payload: IScoreHistoryPayload = {
      score: 30,
      description: 'Participação em evento',
    };

    it('should successfully register score, manage loading state, and return response', async () => {
      const mockResponse: IResponseModel<{ newScore: number }> = {
        message: 'Success',
        data: { newScore: 130 },
      };

      apiPortMock.registerScore.mockResolvedValueOnce(mockResponse);

      const promise = store.registerScore(unitId, payload);

      // Verifica se o loading foi ativado e o erro limpo imediatamente
      expect(store.isLoading()).toBe(true);
      expect(store.error()).toBeNull();

      const result = await promise;

      expect(result).toEqual(mockResponse);
      expect(apiPortMock.registerScore).toHaveBeenCalledWith(unitId, payload);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should handle error, set error signal, stop loading, and rethrow error when registration fails', async () => {
      const mockError = new ApiError('Unit score limit exceeded', 400);
      apiPortMock.registerScore.mockRejectedValueOnce(mockError);

      await expect(store.registerScore(unitId, payload)).rejects.toThrow(mockError);

      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBe('Unit score limit exceeded');
    });
  });

  describe('fetchHistory', () => {
    const unitId = '123e4567-e89b-12d3-a456-426614174000';

    it('should successfully fetch history, manage loading state, and return response', async () => {
      const mockResponse: IResponseModel<IScoreHistoryEntity[]> = {
        message: 'Success',
        data: [
          {
            id: 'hist-1',
            tenantId: 'tenant-1',
            unitId,
            score: 20,
            description: 'Teste',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      apiPortMock.getHistoryByUnitId.mockResolvedValueOnce(mockResponse);

      const promise = store.fetchHistory(unitId);

      expect(store.isLoading()).toBe(true);
      expect(store.error()).toBeNull();

      const result = await promise;

      expect(result).toEqual(mockResponse);
      expect(apiPortMock.getHistoryByUnitId).toHaveBeenCalledWith(unitId);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should handle error, set error signal, stop loading, and rethrow error when fetch fails', async () => {
      const mockError = new ApiError('Unit not found', 404);
      apiPortMock.getHistoryByUnitId.mockRejectedValueOnce(mockError);

      await expect(store.fetchHistory(unitId)).rejects.toThrow(mockError);

      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBe('Unit not found');
    });
  });
});