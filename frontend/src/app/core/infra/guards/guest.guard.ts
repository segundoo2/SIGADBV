import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AUTH_STORE_PORT } from '../tokens/auth.token';

export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const authStore = inject(AUTH_STORE_PORT);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    if (authStore.mustChangePassword()) {
      return router.createUrlTree(['/auth/update-password']);
    }
    return router.createUrlTree(['/overview']);
  }

  return true;
};