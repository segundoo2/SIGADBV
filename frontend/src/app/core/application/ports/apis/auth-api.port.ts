import { IAuthCredentialsModel } from '../../models/auth-credentials.model';
import { IAuthSession } from '../../models/auth-session.model';

export interface IAuthApiPort {
  login(credentials: IAuthCredentialsModel): Promise<IAuthSession>;
  refresh(): Promise<IAuthSession>;
  logout(): Promise<void>;
}
