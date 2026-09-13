import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AUTH_STORE_PORT } from '../tokens/auth.token';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authStore = inject(AUTH_STORE_PORT);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
