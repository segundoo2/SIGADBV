import { Response } from 'express';
import { IAuthPayload } from './auth-payload.interface';
import { LoginDto } from '../dtos/login.dto';
import { IJwtPayloadWithExpiry } from './jwt-payload.interface';

export interface IAuthController {
  login(
    tenantSlug: string | undefined,
    deviceId: string | undefined,
    userAgent: string | undefined,
    loginDto: LoginDto,
  ): Promise<IAuthPayload>;

  refresh(
    userPayload: IJwtPayloadWithExpiry,
    deviceId: string | undefined,
    userAgent: string | undefined,
  ): Promise<IAuthPayload>;

  logout(userPayload: IJwtPayloadWithExpiry, res: Response): Promise<Response>;
}
