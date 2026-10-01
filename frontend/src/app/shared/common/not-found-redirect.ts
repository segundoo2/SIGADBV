import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';

@Component({
  selector: 'app-not-found-redirect',
  template: '',
})
export class NotFoundRedirect {
  private readonly authStore = inject(AUTH_STORE_PORT);
  private readonly router = inject(Router);

  constructor() {
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
