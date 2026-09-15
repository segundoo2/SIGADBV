import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TENANT_CONTEXT_PORT } from '../tokens/auth.token';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const isAuthLoginRequest = req.url.includes('/auth');

  if (!isAuthLoginRequest) {
    return next(req);
  }

  const tenantContext = inject(TENANT_CONTEXT_PORT, { optional: true });

  if (!tenantContext) {
    return next(req);
  }

  const tenantSlug = tenantContext.getTenantSlug();

  if (!tenantSlug) {
    return next(req);
  }

  const clonedReq = req.clone({
    headers: req.headers.set('x-tenant-slug', tenantSlug),
  });

  return next(clonedReq);
};
