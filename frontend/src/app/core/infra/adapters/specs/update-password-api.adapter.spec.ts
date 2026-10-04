import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { UpdatePasswordApiAdapter } from '../update-password-api.adapter';
import { IUpdatePasswordInput } from '../../../application/models/update-password-input.model';
import { URL } from '../../tokens/url.token';
import { apiErrorInterceptor } from '../../interceptors/api-error.interceptor';
import { ApiResponseDto } from '../dtos/api-response.dto';

describe('UpdatePasswordApiAdapter', () => {
  let adapter: UpdatePasswordApiAdapter;
  let httpMock: HttpTestingController;
  const baseUrl = `${URL}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UpdatePasswordApiAdapter,
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    adapter = TestBed.inject(UpdatePasswordApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send PATCH request with update password DTO and return response on success', async () => {
    const payload: IUpdatePasswordInput = {
      username: 'john.doe',
      password: 'newSecurePassword123',
      mustChangePassword: false,
    };

    const mockResponse: ApiResponseDto<null> = {
      message: 'Password updated successfully',
      data: null,
    };

    const updatePromise = adapter.updatePassword(payload);

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);

    req.flush(mockResponse);

    await expect(updatePromise).resolves.toBeUndefined();
  });

  it('should normalize NestJS errors when the update request fails', async () => {
    const payload: IUpdatePasswordInput = {
      username: 'john.doe',
      password: 'newSecurePassword123',
      mustChangePassword: false,
    };

    const updatePromise = adapter.updatePassword(payload);

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('PATCH');

    req.flush(
      {
        statusCode: 400,
        message: 'Invalid password format',
        error: 'Bad Request',
      },
      { status: 400, statusText: 'Bad Request' },
    );

    await expect(updatePromise).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Invalid password format',
      status: 400,
    });
  });
});
