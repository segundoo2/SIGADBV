import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AUTH_STORE_PORT } from './core/infra/tokens/auth.token';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly authStore = inject(AUTH_STORE_PORT);

  async ngOnInit(): Promise<void> {
    await this.authStore.checkSession();
  }
}
