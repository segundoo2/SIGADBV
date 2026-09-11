import { IAuthPayload } from './auth-payload.interface';
import { Request, Response } from 'express';
import { RequestWithCookies } from './req-with-cookies.interface';
import { LoginDto } from '../dtos/login.dto';

export interface IAuthController {
  login(req: Request, loginDto: LoginDto): Promise<IAuthPayload>;

  refresh(req: RequestWithCookies): Promise<IAuthPayload>;

  logout(req: RequestWithCookies, res: Response): Promise<Response>;
}
