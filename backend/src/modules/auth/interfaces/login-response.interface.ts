import { IResponse } from '../../../common/interfaces/response.interface';
import { User } from '../../users/entities/user.entity';
import { ITokens } from './token.interface';

export interface ILoginResponse extends IResponse<
  ITokens & { user: Omit<User, 'password'> }
> {
  mustChangePassword: boolean;
}
