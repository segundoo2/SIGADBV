import { IResponse } from '../../../common/interfaces/response.interface';
import { ITokens } from './token.interface';

export interface ILoginResponse extends IResponse<ITokens> {
  mustChangePassword: boolean;
}
