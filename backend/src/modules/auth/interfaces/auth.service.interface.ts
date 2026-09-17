import { IJwtPayloadWithExpiry } from './jwt-payload.interface';
import { EAuthSuccess } from '../../../common/enum/auth-success.enum';
import { LoginDto } from '../dtos/login.dto';
import { IResponse } from '../../../common/interfaces/response.interface';
import { ITokens } from './token.interface';

export interface IAuthService {
  login(
    loginDto: LoginDto & { slug: string },
    fingerprint: string,
  ): Promise<IResponse<ITokens> & { mustChangePassword: boolean }>;

  refresh(
    payload: IJwtPayloadWithExpiry,
    fingerprint: string,
  ): Promise<ITokens>;

  logout(payload: IJwtPayloadWithExpiry): Promise<{ message: EAuthSuccess }>;
}
