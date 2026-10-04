import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AUTH_STORE_PORT } from './core/infra/tokens/auth.token';
import { FooterComponent } from './shared/footers/footer.component';

@Component({
  imports: [RouterOutlet, FooterComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly authStore = inject(AUTH_STORE_PORT);

  async ngOnInit(): Promise<void> {
    await this.authStore.restoreAuthenticationSession();
  }
}
