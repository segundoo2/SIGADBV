import { IJwtPayloadWithExpiry } from './jwt-payload.interface';
import { IAuthPayload } from './auth-payload.interface';
import { EAuthSuccess } from '../../../common/enum/auth-success.enum';
import { LoginDto } from '../dtos/login.dto';

export interface IAuthService {
  login(loginDto: LoginDto, fingerprint: string): Promise<IAuthPayload>;

  refresh(
    payload: IJwtPayloadWithExpiry,
    fingerprint: string,
  ): Promise<IAuthPayload>;

  logout(payload: IJwtPayloadWithExpiry): Promise<{ message: EAuthSuccess }>;
}
