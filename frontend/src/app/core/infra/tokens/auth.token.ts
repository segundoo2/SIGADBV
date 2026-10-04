import { InjectionToken } from '@angular/core';
import { ITenantContextPort } from '../../application/ports/tenant-context.port';
import { IAuthApiPort } from '../../application/ports/apis/auth-api.port';
import { IAuthStorePort } from '../../application/ports/stores/auth-store.port';

export const AUTH_API_PORT = new InjectionToken<IAuthApiPort>('AUTH_API_PORT');
export const TENANT_CONTEXT_PORT = new InjectionToken<ITenantContextPort>(
  'TENANT_CONTEXT_PORT',
);
export const AUTH_STORE_PORT = new InjectionToken<IAuthStorePort>(
  'AUTH_STORE_PORT',
);
