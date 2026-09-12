import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { UrlTenantContextAdapter } from './core/infra/adapters/url-tenant-context.adapter';
import { tenantInterceptor } from './core/infra/interceptors/tenant.interceptor';
import { AUTH_STORE_PORT, TENANT_CONTEXT_PORT } from './core/infra/tokens/auth.token';
import { AuthStore } from './core/store/auth.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([tenantInterceptor])),
    //infra
    {
      provide: TENANT_CONTEXT_PORT,
      useClass: UrlTenantContextAdapter,
    },
    //store
    {
      provide: AUTH_STORE_PORT,
      useClass: AuthStore,
    },
  ]
};
