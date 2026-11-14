import { InjectionToken } from '@angular/core';
import { IRolesApiPort } from '../../application/ports/apis/roles-api.port';

export const ROLES_API_PORT = new InjectionToken<IRolesApiPort>(
  'ROLES_API_PORT',
);
