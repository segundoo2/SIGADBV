import { describe, expect, it } from 'vitest';
import { UrlTenantContextAdapter } from '../url-tenant-context.adapter';

describe('UrlTenantContextAdapter', () => {
  it('should return the configured tenant slug', () => {
    const adapter = new UrlTenantContextAdapter();
    const tenantSlug = adapter.getTenantSlug();

    expect(tenantSlug).toBe('sigadbv');
  });
});
