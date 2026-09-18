import { IAuthCredentialsModel } from "../models/auth-credentials.model";
import { IAuthResponseModel } from "../models/auth-response.model";

export interface IAuthApiPort {
  login(credentials: IAuthCredentialsModel): Promise<IAuthResponseModel>;
  refresh(): Promise<IAuthResponseModel>;
  logout(): Promise<Omit<IAuthResponseModel, 'mustChangePassword'>>;
}
