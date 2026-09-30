import { IAuthCredentialsModel } from "../models/auth-credentials.model";

export interface IAuthStorePort {
  readonly isAuthenticated: () => boolean;
  readonly mustChangePassword: () => boolean;
  readonly currentUsername: () => string;
  readonly isLoading: () => boolean;
  readonly error: () => string | null;

  login(credentials: IAuthCredentialsModel): Promise<boolean>;
  checkSession(): Promise<void> ;
  logout(): Promise<void>;
}
