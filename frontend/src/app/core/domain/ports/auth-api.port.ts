import { AuthCredentialsModel, IAuthResponseModel } from '../models/auth.model';

export interface IAuthApiPort {
  login(credentials: AuthCredentialsModel): Promise<IAuthResponseModel>;
  refresh(): Promise<IAuthResponseModel>;
  logout(): Promise<IAuthResponseModel>;
}
