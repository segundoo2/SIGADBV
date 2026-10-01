import { InjectionToken } from '@angular/core';
import { IUnitsApiPort } from '../../domain/ports/apis/units-api.port';
import { IUnitsStorePort } from '../../domain/ports/stores/units-store.port';


export const UNITS_API_PORT = new InjectionToken<IUnitsApiPort>(
  'UNITS_API_PORT',
);

export const UNITS_STORE_PORT = new InjectionToken<IUnitsStorePort>(
  'UNITS_STORE_PORT',
);
