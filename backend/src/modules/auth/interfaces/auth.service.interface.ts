import { IJwtPayloadWithExpiry } from './jwt-payload.interface';
import { EAuthSuccess } from '../../../common/enum/auth/auth-success.enum';
import { LoginDto } from '../dtos/login.dto';
import { ILoginResponse } from './login-response.interface';

export interface IAuthService {
  login(
    loginDto: LoginDto & { slug: string },
    fingerprint: string,
  ): Promise<ILoginResponse>;

  refresh(
    payload: IJwtPayloadWithExpiry,
    fingerprint: string,
  ): Promise<ILoginResponse>;

  logout(payload: IJwtPayloadWithExpiry): Promise<{ message: EAuthSuccess }>;
}
