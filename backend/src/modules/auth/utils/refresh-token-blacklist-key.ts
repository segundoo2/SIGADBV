import type { IJwtPayloadWithExpiry } from '../interfaces/jwt-payload.interface';

export function getRefreshTokenBlacklistKey(
  payload: IJwtPayloadWithExpiry,
): string {
  const sessionId = payload.jti ? `:${payload.jti}` : '';

  return `blacklist:refresh:${payload.sub}:${payload.exp}${sessionId}`;
}
