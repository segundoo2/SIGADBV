import { InjectionToken } from '@angular/core';
import { IAdminManagementApiPort } from '../../application/ports/apis/admin-management-api.port';
import { IAdminStorePort } from '../../application/ports/stores/admin-store.port';

export const ADMIN_API_PORT = new InjectionToken<IAdminManagementApiPort>(
  'ADMIN_API_PORT',
);

export const ADMIN_STORE_PORT = new InjectionToken<IAdminStorePort>(
  'ADMIN_STORE_PORT',
);
