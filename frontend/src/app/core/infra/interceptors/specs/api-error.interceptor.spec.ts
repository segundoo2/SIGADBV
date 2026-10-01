import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EErrorsGlobal } from '../../../domain/enums/errors-global.enum';
import {
  apiErrorInterceptor,
  ApiError,
} from '../api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should convert a NestJS string message to ApiError', async () => {
    const request = firstValueFrom(http.get('/api/resource'));
    httpMock.expectOne('/api/resource').flush(
      { statusCode: 400, message: 'Invalid request', error: 'Bad Request' },
      { status: 400, statusText: 'Bad Request' },
    );

    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Invalid request',
      status: 400,
    });
  });

  it('should join validation messages returned as an array', async () => {
    const request = firstValueFrom(http.get('/api/resource'));
    httpMock.expectOne('/api/resource').flush(
      {
        statusCode: 400,
        message: ['username must be longer', 'password is required'],
        error: 'Bad Request',
      },
      { status: 400, statusText: 'Bad Request' },
    );

    await expect(request).rejects.toMatchObject({
      message: 'username must be longer, password is required',
    });
  });

  it('should use the global message when the connection fails', async () => {
    const request = firstValueFrom(http.get('/api/resource'));
    httpMock.expectOne('/api/resource').error(new ProgressEvent('error'));

    await expect(request).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: EErrorsGlobal.SERVER_ERROR,
        status: 0,
      } satisfies Partial<ApiError>),
    );
  });

  it('should use the HTTP status when the response has no message', async () => {
    const request = firstValueFrom(http.get('/api/resource'));
    httpMock.expectOne('/api/resource').flush(
      { statusCode: 500 },
      { status: 500, statusText: 'Internal Server Error' },
    );

    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Erro na requisição (HTTP 500).',
      status: 500,
    });
  });
});