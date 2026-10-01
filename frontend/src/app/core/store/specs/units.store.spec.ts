import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EUnitGender } from '../../domain/enums/unit-gender.enum';
import { IUnitEntity } from '../../domain/entities/unit.entity';
import { IResponseModel } from '../../domain/models/response.model';
import { UNITS_API_PORT } from '../../infra/tokens/units.token';
import { ApiError } from '../../infra/interceptors/api-error.interceptor';
import { UnitsStore } from '../units.store';

describe('UnitsStore', () => {
  let store: UnitsStore;
  const apiMock = { getAllUnits: vi.fn() };

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
    apiMock.getAllUnits.mockReset();

    TestBed.configureTestingModule({
      providers: [UnitsStore, { provide: UNITS_API_PORT, useValue: apiMock }],
    });

    store = TestBed.inject(UnitsStore);
  });

  it('should initialize with empty state', () => {
    expect(store.unitsList()).toEqual([]);
    expect(store.successMessage()).toBe('');
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should fetch units and update its state', async () => {
    const response: IResponseModel<IUnitEntity[]> = {
      message: 'Units loaded',
      data: units,
    };
    apiMock.getAllUnits.mockResolvedValueOnce(response);

    const promise = store.getAllUnits();

    expect(store.isLoading()).toBe(true);
    expect(store.error()).toBeNull();

    await expect(promise).resolves.toEqual(response);

    expect(apiMock.getAllUnits).toHaveBeenCalledOnce();
    expect(store.unitsList()).toEqual(units);
    expect(store.successMessage()).toBe('Units loaded');
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should expose and rethrow the normalized API error', async () => {
    const error = new ApiError('Tenant has no units', 404);
    apiMock.getAllUnits.mockRejectedValueOnce(error);

    await expect(store.getAllUnits()).rejects.toBe(error);

    expect(store.error()).toBe('Tenant has no units');
    expect(store.isLoading()).toBe(false);
    expect(store.successMessage()).toBe('');
  });

  it('should clear previous error and success message before fetching again', async () => {
    apiMock.getAllUnits.mockRejectedValueOnce(new ApiError('Unavailable', 503));
    await expect(store.getAllUnits()).rejects.toThrow('Unavailable');

    apiMock.getAllUnits.mockResolvedValueOnce({
      message: 'Recovered',
      data: units,
    });
    const promise = store.getAllUnits();

    expect(store.error()).toBeNull();
    expect(store.successMessage()).toBe('');

    await promise;

    expect(store.error()).toBeNull();
    expect(store.successMessage()).toBe('Recovered');
  });
});
