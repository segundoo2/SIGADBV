import { InjectionToken } from '@angular/core';
import { AuthCredentialsModel } from '../models/auth.model';

export interface IAuthStorePort {
  readonly isAuthenticated: () => boolean;
  readonly isLoading: () => boolean;
  readonly error: () => string | null;

  login(credentials: AuthCredentialsModel): Promise<boolean>;
  logout(): Promise<void>;
}