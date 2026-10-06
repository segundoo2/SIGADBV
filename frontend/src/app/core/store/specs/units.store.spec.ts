import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EUnitGender } from '../../domain/enums/unit-gender.enum';
import { IUnitEntity } from '../../domain/entities/unit.entity';
import { UNITS_API_PORT } from '../../infra/tokens/units.token';
import { ApiError } from '../../infra/interceptors/api-error.interceptor';
import { UnitCatalogStore } from '../units.store';

describe('UnitCatalogStore', () => {
  let store: UnitCatalogStore;
  const apiMock = { fetchAllUnits: vi.fn() };

  const units: IUnitEntity[] = [
    {
      id: 'unit-1',
      tenantId: 'tenant-1',
      name: 'Unidade Alpha',
      gender: EUnitGender.MIXED,
      maxMembers: 8,
      score: 120,
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-02T10:00:00.000Z'),
    },
  ];

  beforeEach(() => {
    apiMock.fetchAllUnits.mockReset();

    TestBed.configureTestingModule({
      providers: [
        UnitCatalogStore,
        { provide: UNITS_API_PORT, useValue: apiMock },
      ],
    });

    store = TestBed.inject(UnitCatalogStore);
  });

  it('should initialize with empty state', () => {
    expect(store.unitsList()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should fetch units and update its state', async () => {
    apiMock.fetchAllUnits.mockResolvedValueOnce(units);

    const promise = store.fetchAllUnits();

    expect(store.isLoading()).toBe(true);
    expect(store.error()).toBeNull();

    await expect(promise).resolves.toEqual(units);

    expect(apiMock.fetchAllUnits).toHaveBeenCalledOnce();
    expect(store.unitsList()).toEqual(units);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should expose and rethrow the normalized API error', async () => {
    const error = new ApiError('Tenant has no units', 404);
    apiMock.fetchAllUnits.mockRejectedValueOnce(error);

    await expect(store.fetchAllUnits()).rejects.toBe(error);

    expect(store.error()).toBe('Tenant has no units');
    expect(store.isLoading()).toBe(false);
  });

  it('should clear the previous error before fetching again', async () => {
    apiMock.fetchAllUnits.mockRejectedValueOnce(
      new ApiError('Unavailable', 503),
    );
    await expect(store.fetchAllUnits()).rejects.toThrow('Unavailable');

    apiMock.fetchAllUnits.mockResolvedValueOnce(units);
    const promise = store.fetchAllUnits();

    expect(store.error()).toBeNull();

    await promise;

    expect(store.error()).toBeNull();
  });
});
