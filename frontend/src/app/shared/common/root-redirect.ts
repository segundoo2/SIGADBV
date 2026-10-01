import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';

@Component({
  selector: 'app-root-redirect',
  template: '',
})
export class RootRedirect implements OnInit {
  private readonly authStore = inject(AUTH_STORE_PORT);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      await this.router.navigate(['/auth'], { replaceUrl: true });
      return;
    }

    if (this.authStore.mustChangePassword()) {
      await this.router.navigate(['/auth/update-password'], { replaceUrl: true });
    } else {
      await this.router.navigate(['/overview'], { replaceUrl: true });
    }
  }
}