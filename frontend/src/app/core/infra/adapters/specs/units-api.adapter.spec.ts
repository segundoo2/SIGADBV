import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EUnitGender } from '../../../domain/enums/unit-gender.enum';
import { IUnitEntity } from '../../../domain/entities/unit.entity';
import { IResponseModel } from '../../../domain/models/response.model';
import { apiErrorInterceptor } from '../../interceptors/api-error.interceptor';
import { UnitsApiAdapter } from '../units-api.adapter';

describe('UnitsApiAdapter', () => {
  let adapter: UnitsApiAdapter;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:3000/units';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        UnitsApiAdapter,
      ],
    });

    adapter = TestBed.inject(UnitsApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch and return all units', async () => {
    const unit: IUnitEntity = {
      id: 'unit-1',
      tenantId: 'tenant-1',
      name: 'Unidade Alpha',
      gender: EUnitGender.MIXED,
      maxMembers: 8,
      score: 120,
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-02T10:00:00.000Z'),
    };
    const response: IResponseModel<IUnitEntity[]> = {
      message: 'Units loaded',
      data: [unit],
    };

    const promise = adapter.getAllUnits();
    const request = httpMock.expectOne(baseUrl);

    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);

    request.flush(response);

    await expect(promise).resolves.toEqual(response);
  });

  it('should normalize NestJS errors when fetching units fails', async () => {
    const promise = adapter.getAllUnits();
    const request = httpMock.expectOne(baseUrl);

    request.flush(
      { statusCode: 403, message: 'Access denied for this tenant', error: 'Forbidden' },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(promise).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Access denied for this tenant',
      status: 403,
    });
  });
});