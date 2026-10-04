import { UserEntity } from '../../../domain/entities/user.entity';
import { IAuthCredentialsModel } from '../../models/auth-credentials.model';

export interface IAuthStorePort {
  readonly isAuthenticated: () => boolean;
  readonly mustChangePassword: () => boolean;
  readonly currentUserEntity: () => UserEntity | null;
  readonly isLoading: () => boolean;
  readonly error: () => string | null;

  login(credentials: IAuthCredentialsModel): Promise<boolean>;
  restoreAuthenticationSession(): Promise<void>;
  logout(): Promise<void>;
}
