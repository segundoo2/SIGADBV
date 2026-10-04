import { InjectionToken } from '@angular/core';
import { IUpdatePasswordApiPort } from '../../application/ports/apis/update-password-api.port';
import { IUpdatePasswordStorePort } from '../../application/ports/stores/update-password-store.port';

export const UPDATE_PASSWORD_API_PORT =
  new InjectionToken<IUpdatePasswordApiPort>('UPDATE_PASSWORD_API_PORT');

export const UPDATE_PASSWORD_STORE_PORT =
  new InjectionToken<IUpdatePasswordStorePort>('UPDATE_PASSWORD_STORE_PORT');
