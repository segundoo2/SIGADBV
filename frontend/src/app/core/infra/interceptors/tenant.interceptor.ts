import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TENANT_CONTEXT_PORT } from '../tokens/auth.token';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  // Filtra para aplicar o header apenas na rota de login (ou rotas públicas sem JWT)
  const isAuthLoginRequest = req.url.includes('/auth/login');

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

  // Clona a requisição adicionando o header x-tenant-slug somente para o login
  const clonedReq = req.clone({
    headers: req.headers.set('x-tenant-slug', tenantSlug),
  });

  return next(clonedReq);
};