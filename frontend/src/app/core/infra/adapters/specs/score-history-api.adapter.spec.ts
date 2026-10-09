import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { IScoreHistoryEntity } from '../../../domain/entities/score-history.entity';
import { IScoreHistoryPayload } from '../../../application/models/score-history-payload.model';
import { URL } from '../../../infra/tokens/url.token';
import { ScoreHistoryApiAdapter } from '../score-history-api.adapter';
import { apiErrorInterceptor } from '../../interceptors/api-error.interceptor';
import { IApiResponseModel } from '../../../application/models/api-response.model';

describe('ScoreHistoryApiAdapter', () => {
  let adapter: ScoreHistoryApiAdapter;
  let httpMock: HttpTestingController;
  const mockBaseUrl = URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ScoreHistoryApiAdapter,
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    adapter = TestBed.inject(ScoreHistoryApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('registerUnitScore', () => {
    it('should send a POST request with the correct url and payload, returning the updated score', async () => {
      const unitId = '123e4567-e89b-12d3-a456-426614174000';
      const payload: IScoreHistoryPayload = {
        score: 50,
        description: 'Presença com uniforme completo',
      };

      const mockResponse: IApiResponseModel<{ newScore: number }> = {
        message: 'Score registered successfully',
        data: { newScore: 150 },
      };

      const promise = adapter.registerUnitScore(unitId, payload);

      const req = httpMock.expectOne(`${mockBaseUrl}/score-history/${unitId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);

      req.flush(mockResponse);
      const result = await promise;

      expect(result).toBeUndefined();
    });

    it('should normalize NestJS errors when registerScore fails', async () => {
      const unitId = '123e4567-e89b-12d3-a456-426614174000';
      const payload: IScoreHistoryPayload = {
        score: 50,
        description: 'Presença com uniforme completo',
      };

      const promise = adapter.registerUnitScore(unitId, payload);

      const req = httpMock.expectOne(`${mockBaseUrl}/score-history/${unitId}`);
      expect(req.request.method).toBe('POST');

      const errorMessage = 'Unit score limit exceeded';
      req.flush(
        { statusCode: 400, message: errorMessage, error: 'Bad Request' },
        { status: 400, statusText: 'Bad Request' },
      );

      await expect(promise).rejects.toMatchObject({
        name: 'ApiError',
        message: errorMessage,
        status: 400,
      });
    });
  });

  describe('fetchUnitScoreHistory', () => {
    it('should send a GET request with limit query param to the correct url and return the score history list', async () => {
      const unitId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResponse: IApiResponseModel<IScoreHistoryEntity[]> = {
        message: 'Score history retrieved successfully',
        data: [],
      };

      const promise = adapter.fetchUnitScoreHistory(unitId, 10);

      const req = httpMock.expectOne(
        `${mockBaseUrl}/score-history/${unitId}?limit=10`,
      );
      expect(req.request.method).toBe('GET');

      req.flush(mockResponse);
      const result = await promise;

      expect(result).toEqual(mockResponse.data);
    });

    it('should normalize NestJS errors when getHistoryByUnitId fails', async () => {
      const unitId = '123e4567-e89b-12d3-a456-426614174000';

      const promise = adapter.fetchUnitScoreHistory(unitId);

      const req = httpMock.expectOne(`${mockBaseUrl}/score-history/${unitId}`);
      expect(req.request.method).toBe('GET');

      req.flush(
        { statusCode: 404, message: 'Unit not found', error: 'Not Found' },
        { status: 404, statusText: 'Not Found' },
      );

      await expect(promise).rejects.toMatchObject({
        name: 'ApiError',
        message: 'Unit not found',
        status: 404,
      });
    });
  });
});
