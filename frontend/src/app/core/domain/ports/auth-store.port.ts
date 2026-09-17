import { IAuthCredentialsModel } from "../models/auth-credentials.model";

export interface IAuthStorePort {
  readonly isAuthenticated: () => boolean;
  readonly isLoading: () => boolean;
  readonly error: () => string | null;

  login(credentials: IAuthCredentialsModel): Promise<boolean>;
  logout(): Promise<void>;
}
