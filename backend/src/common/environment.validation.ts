import { randomBytes } from 'node:crypto';

const MIN_SECRET_BYTES = 32;
const KNOWN_INSECURE_SECRETS = new Set([
  'secret',
  'secret-key',
  'refresh-secret-key',
  'password',
  'changeme',
  'change-me',
  'your-secret-here',
]);

function resolveJwtSecret(
  value: unknown,
  variableName: 'JWT_SECRET' | 'JWT_REFRESH_SECRET',
  isProduction: boolean,
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    if (isProduction) {
      throw new Error(`${variableName} must be configured in production.`);
    }

    return randomBytes(32).toString('base64');
  }

  const secret = value.trim();
  if (
    Buffer.byteLength(secret, 'utf8') < MIN_SECRET_BYTES ||
    KNOWN_INSECURE_SECRETS.has(secret.toLowerCase())
  ) {
    throw new Error(
      `${variableName} must be a non-placeholder secret of at least 32 bytes.`,
    );
  }

  return secret;
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const isProduction = environment.NODE_ENV === 'production';
  const jwtSecret = resolveJwtSecret(
    environment.JWT_SECRET,
    'JWT_SECRET',
    isProduction,
  );
  const jwtRefreshSecret = resolveJwtSecret(
    environment.JWT_REFRESH_SECRET,
    'JWT_REFRESH_SECRET',
    isProduction,
  );

  if (jwtSecret === jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different.');
  }

  return {
    ...environment,
    JWT_SECRET: jwtSecret,
    JWT_REFRESH_SECRET: jwtRefreshSecret,
  };
}
