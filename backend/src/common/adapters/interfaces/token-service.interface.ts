export type TokenDuration =
  | `${number}m`
  | `${number}h`
  | `${number}d`
  | `${number}s`
  | number;

export interface ITokenService {
  signAsync<T extends object>(
    payload: T,
    options?: { secret: string; expiresIn: TokenDuration },
  ): Promise<string>;
}
