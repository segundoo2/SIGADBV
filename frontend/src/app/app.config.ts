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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([tenantInterceptor, authInterceptor])),
    provideServiceWorker('ngsw-worker.ts', {
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
    //store
    {
      provide: AUTH_STORE_PORT,
      useClass: AuthStore,
    },
    { provide: UPDATE_PASSWORD_STORE_PORT, useClass: UpdatePasswordStore },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
