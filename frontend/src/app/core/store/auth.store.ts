import { Injectable, inject, signal, computed } from "@angular/core";
import { IAuthStorePort } from "../domain/ports/auth-store.port";
import { AUTH_API_PORT } from "../infra/tokens/auth.token";
import { IAuthCredentialsModel } from "../domain/models/auth-credentials.model";

export interface AuthState {
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStore implements IAuthStorePort {
  private readonly authApiPort = inject(AUTH_API_PORT);

  private readonly _state = signal<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);

  async login(credentials: IAuthCredentialsModel): Promise<boolean> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));
    console.log(credentials)

    try {
      await this.authApiPort.login(credentials);
      this._state.update((s) => ({
        ...s,
        isAuthenticated: true,
        isLoading: false,
      }));
      return true;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ops! Ocorreu um erro inesperado ao conectar com o servidor. Tente novamente mais tarde.';

      this._state.update((s) => ({
        ...s,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }

  async logout(): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true }));

    try {
      await this.authApiPort.logout();
    } finally {
      this._state.set({
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }
}
