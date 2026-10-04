import { InjectionToken } from '@angular/core';
import { IUsersApiPort } from '../../domain/ports/apis/users-api.port';
import { IUsersStorePort } from '../../domain/ports/stores/users-store.port';

export const USERS_API_PORT = new InjectionToken<IUsersApiPort>('USERS_API_PORT');

export const USERS_STORE_PORT = new InjectionToken<IUsersStorePort>('USERS_STORE_PORT');