import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  ITokenService,
  TokenDuration,
} from '../../modules/auth/interfaces/jwt-service.interface';

@Injectable()
export class JwtAdapter implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  async signAsync<T extends object>(
    payload: T,
    options?: { expiresIn: TokenDuration },
  ): Promise<string> {
    const signOptions: JwtSignOptions = {};

    if (options?.expiresIn) {
      signOptions.expiresIn = options.expiresIn;
    }

    return this.jwtService.signAsync(payload, signOptions);
  }
}
