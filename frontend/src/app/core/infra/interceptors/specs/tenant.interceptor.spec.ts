import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { tenantInterceptor } from '../tenant.interceptor';
import { ITenantContextPort } from '../../../domain/ports/tenant-context.port';
import { TENANT_CONTEXT_PORT } from '../../tokens/auth.token';

describe('tenantInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let tenantContextMock: ITenantContextPort;

  beforeEach(() => {
    tenantContextMock = {
      getTenantSlug: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tenantInterceptor])),
        provideHttpClientTesting(),
        {
          provide: TENANT_CONTEXT_PORT,
          useValue: tenantContextMock,
        },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should inject x-tenant-slug header when making a login request and tenant slug is present', () => {
    vi.spyOn(tenantContextMock, 'getTenantSlug').mockReturnValue('empresa-abc');

    httpClient.post('/api/v1/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('x-tenant-slug')).toBe(true);
    expect(req.request.headers.get('x-tenant-slug')).toBe('empresa-abc');
    req.flush({});
  });

  it('should not inject x-tenant-slug header on non-login requests even if tenant slug is present', () => {
    vi.spyOn(tenantContextMock, 'getTenantSlug').mockReturnValue('empresa-abc');

    httpClient.get('/api/v1/products').subscribe();

    const req = httpMock.expectOne('/api/v1/products');
    expect(req.request.headers.has('x-tenant-slug')).toBe(false);
    req.flush([]);
  });

  it('should not inject x-tenant-slug header on login request when tenant slug is null', () => {
    vi.spyOn(tenantContextMock, 'getTenantSlug').mockReturnValue(null);

    httpClient.post('/api/v1/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('x-tenant-slug')).toBe(false);
    req.flush({});
  });

  it('should proceed gracefully when TENANT_CONTEXT_PORT is not provided', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tenantInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    const unconfiguredClient = TestBed.inject(HttpClient);
    const unconfiguredMock = TestBed.inject(HttpTestingController);

    unconfiguredClient.post('/api/v1/auth/login', {}).subscribe();

    const req = unconfiguredMock.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('x-tenant-slug')).toBe(false);
    unconfiguredMock.verify();
  });
});
