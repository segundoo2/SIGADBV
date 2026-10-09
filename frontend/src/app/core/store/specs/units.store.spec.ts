import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnitScoreHistoryStore } from '../score-history.store';
import { SCORE_HISTORY_API_PORT } from '../../infra/tokens/score-history.token';
import { IScoreHistoryPayload } from '../../application/models/score-history-payload.model';
import { IScoreHistoryEntity } from '../../domain/entities/score-history.entity';
import { ApiError } from '../../infra/interceptors/api-error.interceptor';
import { IUnitEntity } from '../../domain/entities/unit.entity';

describe('UnitScoreHistoryStore', () => {
  let store: UnitScoreHistoryStore;
  let apiPortMock: {
    registerUnitScore: ReturnType<typeof vi.fn>;
    fetchUnitScoreHistory: ReturnType<typeof vi.fn>;
    fetchAllUnitsOptions: ReturnType<typeof vi.fn>;
    fetchPendingScoreHistories: ReturnType<typeof vi.fn>;
    approveScoreHistory: ReturnType<typeof vi.fn>;
    rejectScoreHistory: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiPortMock = {
      registerUnitScore: vi.fn(),
      fetchUnitScoreHistory: vi.fn(),
      fetchAllUnitsOptions: vi.fn(),
      fetchPendingScoreHistories: vi.fn(),
      approveScoreHistory: vi.fn(),
      rejectScoreHistory: vi.fn(),
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
    expect(store.unitsOptions()).toEqual([]);
    expect(store.pendingHistories()).toEqual([]);
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

  describe('fetchAllUnitsOptions', () => {
    it('should fetch and update units options successfully', async () => {
      const mockOptions: Pick<IUnitEntity, 'id' | 'name'>[] = [
        { id: '1', name: 'Alpha' },
      ];
      apiPortMock.fetchAllUnitsOptions.mockResolvedValueOnce(mockOptions);

      await store.fetchAllUnitsOptions();

      expect(store.unitsOptions()).toEqual(mockOptions);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('should handle error when fetching units options fails', async () => {
      const mockError = new ApiError('Failed to load options', 500);
      apiPortMock.fetchAllUnitsOptions.mockRejectedValueOnce(mockError);

      await expect(store.fetchAllUnitsOptions()).rejects.toThrow(mockError);
      expect(store.error()).toBe('Failed to load options');
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('fetchPendingScoreHistories', () => {
    it('should fetch and update pending score histories successfully', async () => {
      const mockPending: IScoreHistoryEntity[] = [
        {
          id: 'hist-1',
          tenantId: 'tenant-1',
          unitId: 'unit-1',
          score: 10,
          description: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      apiPortMock.fetchPendingScoreHistories.mockResolvedValueOnce(mockPending);

      await store.fetchPendingScoreHistories();

      expect(store.pendingHistories()).toEqual(mockPending);
      expect(store.isLoading()).toBe(false);
    });

    it('should handle error and clear pending histories when fetch fails', async () => {
      const mockError = new ApiError('Error loading pending', 500);
      apiPortMock.fetchPendingScoreHistories.mockRejectedValueOnce(mockError);

      await expect(store.fetchPendingScoreHistories()).rejects.toThrow(
        mockError,
      );
      expect(store.pendingHistories()).toEqual([]);
      expect(store.error()).toBe('Error loading pending');
    });
  });

  describe('approveScoreHistory', () => {
    it('should approve history and remove it from pending list', async () => {
      const initialItem: IScoreHistoryEntity = {
        id: 'hist-1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        score: 10,
        description: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Inicia com um item pendente
      store['_pendingHistories'].set([initialItem]);
      apiPortMock.approveScoreHistory.mockResolvedValueOnce(undefined);

      await store.approveScoreHistory('hist-1');

      expect(apiPortMock.approveScoreHistory).toHaveBeenCalledWith('hist-1');
      expect(store.pendingHistories()).toEqual([]);
      expect(store.isLoading()).toBe(false);
    });

    it('should handle error when approval fails', async () => {
      const mockError = new ApiError('Approval failed', 400);
      apiPortMock.approveScoreHistory.mockRejectedValueOnce(mockError);

      await expect(store.approveScoreHistory('hist-1')).rejects.toThrow(
        mockError,
      );
      expect(store.error()).toBe('Approval failed');
    });
  });

  describe('rejectScoreHistory', () => {
    it('should reject history and remove it from pending list', async () => {
      const initialItem: IScoreHistoryEntity = {
        id: 'hist-1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        score: 10,
        description: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store['_pendingHistories'].set([initialItem]);
      apiPortMock.rejectScoreHistory.mockResolvedValueOnce(undefined);

      await store.rejectScoreHistory('hist-1');

      expect(apiPortMock.rejectScoreHistory).toHaveBeenCalledWith('hist-1');
      expect(store.pendingHistories()).toEqual([]);
      expect(store.isLoading()).toBe(false);
    });

    it('should handle error when rejection fails', async () => {
      const mockError = new ApiError('Rejection failed', 400);
      apiPortMock.rejectScoreHistory.mockRejectedValueOnce(mockError);

      await expect(store.rejectScoreHistory('hist-1')).rejects.toThrow(
        mockError,
      );
      expect(store.error()).toBe('Rejection failed');
    });
  });

  describe('clearError', () => {
    it('should reset the error signal to null', async () => {
      const mockError = new ApiError('Some error', 500);
      apiPortMock.registerUnitScore.mockRejectedValueOnce(mockError);

      await expect(
        store.registerUnitScore('unit-1', { score: 10, description: 'test' }),
      ).rejects.toThrow(mockError);
      expect(store.error()).toBe('Some error');

      store.clearError();
      expect(store.error()).toBeNull();
    });
  });
});
