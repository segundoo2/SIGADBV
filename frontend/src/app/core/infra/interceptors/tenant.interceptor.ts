import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TENANT_CONTEXT_PORT } from '../tokens/auth.token';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantContext = inject(TENANT_CONTEXT_PORT, { optional: true });

  if (!tenantContext) {
    return next(req);
  }

  const tenantId = tenantContext.getTenantSlug();

  if (!tenantId) {
    return next(req);
  }

  const clonedReq = req.clone({
    headers: req.headers.set('x-tenant-id', tenantId),
  });

  return next(clonedReq);
};