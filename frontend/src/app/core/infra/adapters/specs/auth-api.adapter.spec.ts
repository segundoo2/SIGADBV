import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { AuthApiAdapter } from '../auth-api.adapter';
import { AuthCredentialsModel, IAuthResponseModel } from '../../../domain/models/auth.model';
import { environment } from '../../../../../environments/environments';


describe('AuthApiAdapter', () => {
  let adapter: AuthApiAdapter;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthApiAdapter,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    adapter = TestBed.inject(AuthApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send POST request with credentials on login and return response', async () => {
    const credentials: AuthCredentialsModel = {
      username: 'john.doe',
      password: 'securePassword123',
    };

    const mockResponse: IAuthResponseModel = {
      message: 'Login successful',
    };

    const loginPromise = adapter.login(credentials);

    const req = httpMock.expectOne(`${baseUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);

    req.flush(mockResponse);

    const result = await loginPromise;
    expect(result).toEqual(mockResponse);
  });

  it('should send POST request to refresh token endpoint', async () => {
    const mockResponse: IAuthResponseModel = {
      message: 'Session refreshed successfully',
    };

    const refreshPromise = adapter.refresh();

    const req = httpMock.expectOne(`${baseUrl}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush(mockResponse);

    const result = await refreshPromise;
    expect(result).toEqual(mockResponse);
  });

  it('should send POST request to logout endpoint', async () => {
    const mockResponse: IAuthResponseModel = {
      message: 'Logout successful',
    };

    const logoutPromise = adapter.logout();

    const req = httpMock.expectOne(`${baseUrl}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush(mockResponse);

    const result = await logoutPromise;
    expect(result).toEqual(mockResponse);
  });
});