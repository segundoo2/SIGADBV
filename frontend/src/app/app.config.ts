import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { UrlTenantContextAdapter } from './core/infra/adapters/url-tenant-context.adapter';
import { tenantInterceptor } from './core/infra/interceptors/tenant.interceptor';
import {
  AUTH_API_PORT,
  AUTH_STORE_PORT,
  TENANT_CONTEXT_PORT,
} from './core/infra/tokens/auth.token';
import { AuthStore } from './core/store/auth.store';
import { AuthApiAdapter } from './core/infra/adapters/auth-api.adapter';
import { provideServiceWorker } from '@angular/service-worker';
import {
  UPDATE_PASSWORD_API_PORT,
  UPDATE_PASSWORD_STORE_PORT,
} from './core/infra/tokens/update-password.token';
import { UpdatePasswordStore } from './core/store/update-password.store';
import { UpdatePasswordApiAdapter } from './core/infra/adapters/update-password-api.adapter';
import { authInterceptor } from './core/infra/interceptors/auth.interceptor';
import {
  SCORE_HISTORY_API_PORT,
  SCORE_HISTORY_STORE_PORT,
} from './core/infra/tokens/score-history.token';
import { ScoreHistoryApiAdapter } from './core/infra/adapters/score-history-api.adapter';
import { ScoreHistoryStore } from './core/store/score-history.store';
import { UnitsStore } from './core/store/units.store';
import {
  UNITS_API_PORT,
  UNITS_STORE_PORT,
} from './core/infra/tokens/units.token';
import { UnitsApiAdapter } from './core/infra/adapters/units-api.adapter';
import { apiErrorInterceptor } from './core/infra/interceptors/api-error.interceptor';
import { USERS_API_PORT, USERS_STORE_PORT } from './core/infra/tokens/users.token';
import { UsersStore } from './core/store/users.store';
import { UsersApiAdapter } from './core/infra/adapters/users-api.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(
      withInterceptors([
        apiErrorInterceptor,
        tenantInterceptor,
        authInterceptor,
      ]),
    ),
    provideServiceWorker('ngsw-worker.ts', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    //infra
    {
      provide: TENANT_CONTEXT_PORT,
      useClass: UrlTenantContextAdapter,
    },
    {
      provide: AUTH_API_PORT,
      useClass: AuthApiAdapter,
    },
    { provide: UPDATE_PASSWORD_API_PORT, useClass: UpdatePasswordApiAdapter },
    { provide: SCORE_HISTORY_API_PORT, useClass: ScoreHistoryApiAdapter },
    { provide: UNITS_API_PORT, useClass: UnitsApiAdapter },
    { provide: USERS_API_PORT, useClass: UsersApiAdapter },
    // store
    {
      provide: AUTH_STORE_PORT,
      useClass: AuthStore,
    },
    { provide: UPDATE_PASSWORD_STORE_PORT, useClass: UpdatePasswordStore },
    { provide: SCORE_HISTORY_STORE_PORT, useClass: ScoreHistoryStore },
    { provide: UNITS_STORE_PORT, useClass: UnitsStore },
    { provide: USERS_STORE_PORT, useClass: UsersStore },
  ],
};
