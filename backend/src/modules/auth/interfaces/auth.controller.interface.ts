import { Response } from 'express';
import { LoginDto } from '../dtos/login.dto';
import { IJwtPayloadWithExpiry } from './jwt-payload.interface';
import { ITokens } from './token.interface';
import { ILoginResponse } from './login-response.interface';

export interface IAuthController {
  login(
    tenantSlug: string | undefined,
    deviceId: string | undefined,
    userAgent: string | undefined,
    loginDto: LoginDto,
  ): Promise<ILoginResponse>;

  refresh(
    userPayload: IJwtPayloadWithExpiry,
    deviceId: string | undefined,
    userAgent: string | undefined,
  ): Promise<ITokens>;

  logout(userPayload: IJwtPayloadWithExpiry, res: Response): Promise<Response>;
}
