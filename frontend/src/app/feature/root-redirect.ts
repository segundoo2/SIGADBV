import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_STORE_PORT } from '../core/infra/tokens/auth.token';

@Component({
  selector: 'app-root-redirect',
  template: '',
})
export class RootRedirect {
  private readonly authStore = inject(AUTH_STORE_PORT);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    if (!authStoreIsAuthenticatedHelper(this.authStore)) {
      await this.authStore.checkSession();
    }

    if (this.authStore.isAuthenticated()) {
      if (this.authStore.mustChangePassword()) {
        this.router.navigate(['/auth/update-password']);
      } else {
        this.router.navigate(['/overview']);
      }
    } else {
      this.router.navigate(['/auth']);
    }
  }
}

function authStoreIsAuthenticatedHelper(store: any): boolean {
  return store.isAuthenticated();
}