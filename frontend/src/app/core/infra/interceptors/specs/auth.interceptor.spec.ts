import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { authInterceptor } from '../auth.interceptor';
import { IAuthApiPort } from '../../../domain/ports/auth-api.port';
import { IAuthStorePort } from '../../../domain/ports/auth-store.port';
import { AUTH_API_PORT, AUTH_STORE_PORT } from '../../tokens/auth.token';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authApiMock: IAuthApiPort;
  let authStoreMock: IAuthStorePort;

  beforeEach(() => {
    authApiMock = {
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
    };

    authStoreMock = {
      isAuthenticated: vi.fn(),
      isLoading: vi.fn(),
      error: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AUTH_API_PORT, useValue: authApiMock },
        { provide: AUTH_STORE_PORT, useValue: authStoreMock },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve permitir requisições bem-sucedidas sem interferência', () => {
    httpClient.get('/api/v1/products').subscribe((res) => {
      expect(res).toEqual({ data: [] });
    });

    const req = httpMock.expectOne('/api/v1/products');
    req.flush({ data: [] });
  });

  it('deve tentar renovar a sessão ao receber erro 401 e re-executar a requisição original', async () => {
    vi.mocked(authApiMock.refresh).mockResolvedValue({ message: 'Session refreshed' });

    let responseData: unknown;
    httpClient.get('/api/v1/products').subscribe((res) => {
      responseData = res;
    });

    const initialReq = httpMock.expectOne('/api/v1/products');
    initialReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();

    expect(authApiMock.refresh).toHaveBeenCalledTimes(1);

    const retriedReq = httpMock.expectOne('/api/v1/products');
    retriedReq.flush({ data: ['item1'] });

    expect(responseData).toEqual({ data: ['item1'] });
  });

  it('deve deslogar o usuário se a tentativa de refresh falhar com 401', async () => {
    vi.mocked(authApiMock.refresh).mockRejectedValue(new Error('Refresh failed'));

    let errorResponse: HttpErrorResponse | undefined;
    httpClient.get('/api/v1/products').subscribe({
      error: (err: HttpErrorResponse) => {
        errorResponse = err;
      },
    });

    const initialReq = httpMock.expectOne('/api/v1/products');
    initialReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();

    expect(authApiMock.refresh).toHaveBeenCalledTimes(1);
    expect(authStoreMock.logout).toHaveBeenCalledTimes(1);
    expect(errorResponse).toBeDefined();
  });

  it('não deve tentar refresh quando a rota com erro 401 for /auth/login ou /auth/refresh', () => {
    let errorResponse: HttpErrorResponse | undefined;

    httpClient.post('/api/v1/auth/login', {}).subscribe({
      error: (err: HttpErrorResponse) => {
        errorResponse = err;
      },
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(authApiMock.refresh).not.toHaveBeenCalled();
    expect(authStoreMock.logout).not.toHaveBeenCalled();
    expect(errorResponse?.status).toBe(401);
  });
});