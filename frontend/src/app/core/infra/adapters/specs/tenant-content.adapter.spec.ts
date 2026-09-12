import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { UrlTenantContextAdapter } from '../url-tenant-context.adapter';

describe('TenantContextAdapter', () => {
  let adapter: UrlTenantContextAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UrlTenantContextAdapter],
    });

    adapter = TestBed.inject(UrlTenantContextAdapter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should extract tenant identifier from subdomain in production environment', () => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      hostname: 'store.stockup.com.br',
    } as Location);

    const tenant = adapter.getTenantSlug();
    expect(tenant).toBe('store');
  });

  it('should extract tenant identifier from subdomain in local environment', () => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      hostname: 'store.localhost',
    } as Location);

    const tenant = adapter.getTenantSlug();
    expect(tenant).toBe('store');
  });

  it('should return null when accessing apex domain without subdomain', () => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      hostname: 'stockup.com.br',
    } as Location);

    const tenant = adapter.getTenantSlug();
    expect(tenant).toBeNull();
  });

  it('should return null when accessing plain localhost without subdomain', () => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      hostname: 'localhost',
    } as Location);

    const tenant = adapter.getTenantSlug();
    expect(tenant).toBeNull();
  });
});