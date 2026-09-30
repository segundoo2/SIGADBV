import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { UpdatePasswordApiAdapter } from '../update-password-api.adapter';
import { IUpdatePasswordDto } from '../../../domain/models/update-password-dto.model';
import { IResponseModel } from '../../../domain/models/response.model';
import { URL } from '../../tokens/url.token';

describe('UpdatePasswordApiAdapter', () => {
  let adapter: UpdatePasswordApiAdapter;
  let httpMock: HttpTestingController;
  const baseUrl = `${URL}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UpdatePasswordApiAdapter,
        provideHttpClient(),
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
    const payload: IUpdatePasswordDto = {
      username: 'john.doe',
      password: 'newSecurePassword123',
      mustChangePassword: false,
    };

    const mockResponse: IResponseModel<null> = {
      message: 'Password updated successfully',
      data: null,
    };

    const updatePromise = adapter.updatePassword(payload);

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);

    req.flush(mockResponse);

    const result = await updatePromise;
    expect(result).toEqual(mockResponse);
  });

  it('should propagate error when HTTP request fails', async () => {
    const payload: IUpdatePasswordDto = {
      username: 'john.doe',
      password: 'newSecurePassword123',
      mustChangePassword: false,
    };

    const updatePromise = adapter.updatePassword(payload);

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('PATCH');

    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

    await expect(updatePromise).rejects.toThrow();
  });
});