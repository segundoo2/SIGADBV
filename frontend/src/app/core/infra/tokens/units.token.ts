import { InjectionToken } from '@angular/core';
import { IUnitsApiPort } from '../../application/ports/apis/units-api.port';
import { IUnitsStorePort } from '../../application/ports/stores/units-store.port';

export const UNITS_API_PORT = new InjectionToken<IUnitsApiPort>(
  'UNITS_API_PORT',
);

export const UNITS_STORE_PORT = new InjectionToken<IUnitsStorePort>(
  'UNITS_STORE_PORT',
);
